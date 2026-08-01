# Maya production guide: topology and rigging for the house character

Written for Phase 0/1 of `docs/superpowers/specs/2026-07-31-portfolio-house-design.md`, on
the `direction-decision` branch, while Maya is on the table as an alternative to the Blender
path already documented in `docs/blender-production-guide.md`. You already know Maya's menus,
its viewport navigation, and its component modes. This document does not explain those. It
explains the two things you have said you find hard: why a mesh's edge flow decides whether a
joint bends cleanly or creases, and why a joint chain that looks correct in the outliner can
still deform badly the first time you pose it. Everything else here (units, export, the
palette trick) gets the short version, because the character's topology and its rig are what
will make or break this project's biggest risk: whether the kid reads as charming or uncanny.

**Version described:** Maya 2024/2025 menu structure. Autodesk's naming runs roughly a year
ahead of the calendar, so by the time you read this you may be on Maya 2026 with a slightly
different Attribute Editor layout in one or two panels. The menu commands named below
(Multi-Cut, Orient Joint, Bind Skin, and the rest) have held their names and their menu sets
for many versions running, so the paths should still match. If one doesn't: check the menu
set dropdown at the top left of the Status Line first. Maya splits commands across menu sets
(Modeling, Rigging, Animation, FX, Rendering), and the single most common reason a command
"disappeared" is being in the wrong set, not the command having moved or been removed.
Modeling commands live under the Modeling set; Skeleton and Skin live under Rigging. Maya also
has a small search icon toward the right end of the main menu bar in recent versions that
filters commands by typed name, comparable to Blender's F3, though I hold that specific detail
with less confidence than the menu-set point, so treat the menu set check as the first move
and the search icon as a second one to try.

**The code is the source of truth for every dimension in this document.** Every number below
was checked against `src/lib/house/grid.ts` and `src/lib/house/scene.ts` on this branch. If
the code changes after this is written, the code wins and this document is stale until
someone updates it.

## Hard numbers, from the code

- **1 Maya unit equals 1 world unit.** No rescaling anywhere in the pipeline.
- `CELL_WIDTH = 10`, `CELL_HEIGHT = 7` (`grid.ts`). `ROOM_DEPTH = 6`, wall thickness
  `WALL = 0.3` (`scene.ts`). A room's usable volume is 10 wide, 7 tall, 6 deep, with 0.3
  units eaten from shared edges so neighbouring floors and back walls don't touch.
- Six rooms, a 3-wide by 2-tall grid on desktop, re-flowing to 1-wide by 6-tall below 768px
  (`PHONE_BREAKPOINT`, `columnsFor` in `grid.ts`).
- **Row 0 is the top row and holds the earliest rooms.** `worldPositionFor` puts row 0 at
  Y = 0 and every row below it at a more negative Y. Time runs downward: the character
  descends through the house as the story moves forward, from the 2013 bedroom at the top
  to the present-day desk at the bottom.
- Budgets: **200 to 800 triangles per prop**, **2,000 to 4,000 for the character**, **under
  100,000 for the whole scene**, **under 30 draw calls**, **under 2.5 MB compressed for all
  scene assets**. The triangle ceilings are generous on purpose. Draw calls and download size
  bind harder: a scene at 95,000 triangles across one shared material passes every budget
  that matters, while a scene at 40,000 triangles spread across fifteen unique materials
  fails the draw call budget outright. Spend your attention on material count, not triangle
  count.

## The export problem, and why it decides the whole pipeline

Maya's glTF export is not native. It comes from a third-party plugin (Autodesk shipped one
for a while, and community plugins fill the same gap), and results vary release to release:
material conversion, skin weight export, and animation baking each have their own history of
edge cases depending on which plugin and which Maya build you land on. Blender's glTF exporter,
by contrast, is first-party, actively maintained, and the target this whole project's runtime
(three.js) is built to consume. Maya's FBX export is the most mature interchange path Autodesk
ships, and Blender's FBX import is solid. That gives one reliable route through this project,
and it is the only one this guide recommends: **model, rig, and animate in Maya, export FBX,
import into Blender, verify, export glTF from there.**

This matters for a reason beyond convenience. You have Maya for 30 days. This project runs
for months. Whatever workflow you build has to keep working after the trial lapses, which
means the deliverable at the end of every Maya session is an FBX file and a Blender file that
imported it cleanly, not a Maya scene you'll need Maya to open again. Budget time to import
and check each FBX in Blender the same day you export it, while the Maya scene is still open
to fix whatever the import reveals.

Four things break on this trip if you don't plan for them, and each gets a fix later in this
document (Export path, below): **scale**, from a unit mismatch between Maya's working units
and what the FBX exporter assumes; **joint orientation**, because Maya splits a joint's fixed
orientation and its animated rotation into two separate values that Blender's armature bones
don't represent the same way; **custom normals**, if you hand-edit vertex normals in Maya
without using ordinary hard and soft edges; and **non-uniform scale on joints**,
which glTF's skinning model and Blender's bones both handle worse than Maya does. None of
these are exotic edge cases. All four are common enough that a pipeline built without
checking for them will hit at least one.

## Scene setup and units

Maya's default working unit is centimetres. This project has no scale conversion anywhere in
the three.js code: one Maya unit is one world unit, full stop, matching `CELL_WIDTH` and
`CELL_HEIGHT` directly. Open **Windows > Settings/Preferences > Preferences**, the Settings
category, and set **Working Units > Linear** to **Meter**. The label doesn't change any
geometry you've already built, but it matters at export time: Maya's FBX exporter can apply an
automatic unit conversion factor tied to this setting, and if the setting says centimetres
while your modelling habit treats a unit as a metre, that conversion bakes an unwanted 0.01 or
100 scale onto the exported hierarchy. Set it once, at the start, and don't fight it later. A
crate that should read waist-high on the kid is about 1 Maya unit tall, the same way it would
be in Blender.

Set your grid spacing (**Display > Grid**, option box) to something that divides cleanly into
quarters, and hold **X** while transforming to snap to it. Model every prop's key dimensions
as whole units, halves, or quarters, the same discipline the Blender guide describes: a crate
that's exactly 1x1x1, a door that's exactly 1 wide, snap together when you kitbash a room.
Odd, un-round dimensions look fine alone and then visibly fail to align the moment you combine
them with the rest of the kit.

Maya's world is Y-up by default, which happens to already match glTF's Y-up convention. That
is one axis-conversion step this pipeline skips that the Blender-native path can't, since
Blender's own world is Z-up and needs a conversion at export every time. It doesn't remove the
need to check axes after the FBX-to-Blender hop (Blender's FBX importer has its own axis
mapping settings, covered in Export path below), but it means you are not fighting an
orientation problem baked into your own modelling habits the way a Z-up-native artist would.

## Topology: reading and building a mesh that bends

Props barely need this section. The character needs every word of it. State that up
front so you spend your hours where they count: a crate, a shelf, a desk are boxy forms that
never deform, and topology on them is a matter of hitting the 200-to-800 triangle budget
without leaving obvious facets on the silhouette, nothing more. The character is the only mesh
in this kit that gets skinned to a joint and posed, and it is the only mesh where a wrong
decision here costs you later, in a place much harder to fix than the mesh itself: a
weight-painting session that can't succeed because the geometry underneath it doesn't have
enough information to work with.

### Why quads, and when a triangle is fine

A quad has two edge loops crossing it: one running each direction across the face. That
crossing is what gives a mesh a predictable "grain" a joint can bend along, and what gives
weight painting an even surface to distribute influence across. A triangle is not broken
geometry. It is a topological dead end for one purpose only: it carries a loop through in one
direction and stops it in the other, so a triangle sitting inside a deforming zone breaks the
loop that would otherwise carry a bend smoothly across it. On a surface that never bends, a
triangle costs nothing. The cap at the top of a low-detail cylinder, the underside of a crate,
a flat backing panel behind a shelf: all fine as triangles, because nothing there ever asks the
surface to fold. The rule is not "avoid triangles." It is "don't let a triangle sit where a
joint needs to bend."

The same logic sets how many sides a limb's cross-section needs. A cylinder with six sides
around its circumference reads as faceted at close range but holds a bend cleanly at this
project's scale and viewing distance; drop to five and an odd number of sides puts a flat face
directly where a highlight or a silhouette edge would otherwise fall, which reads worse than
the low count itself. Eight sides is a comfortable ceiling for an arm or a leg on a
2,000-to-4,000 triangle budget; going higher spends triangles on roundness the camera distance
in this project will never resolve, budget better spent on the joint zones described below.

### Reading edge flow

An edge loop is a continuous strip of edges running across a mesh, ideally following the
form's actual contour, the way rings on a length of hose follow the hose and never cut
across it. Reading a mesh means following those strips with your eye: do they wrap around a
limb evenly, spaced the way muscle and joint structure would spread them, or do they run
perpendicular to a bend, or bunch up on one side of a limb and thin out on the other. A mesh
that flows has loops that agree with where and how the form will move. A mesh that fights you
has loops that argue with it: a single loop running straight down the front of a knee, never
wrapping around it, or three loops crowded on one side of an arm and one loop covering the
other side, which reads as a limb that wants to twist the moment you rotate it, because the
thin side has too few faces to hold a curve while the dense side has more than it needs.

This is a skill you build by looking at real reference before touching Maya at all, not
something to learn purely from rules on a page. Turn on wireframe on a finished character
model, human or not, from any game or film you admire, and trace the loops around a single
limb with your eye from shoulder to fingertip. The pattern that shows up again and again is
loops running in bands around the limb's circumference, growing denser near every joint and
sparser along every long straight section, with the occasional pole tucked onto a flat area
to absorb the change in density. Once you've traced that pattern on a few finished models it
becomes recognisable at a glance, and recognising it in someone else's mesh is what makes it
possible to build it into your own on purpose, not by accident.

### Poles

A pole is a vertex where something other than four edges meet. The two that come up
constantly on a low-poly character are a three-pole (three edges) and a five-pole (five
edges); anything with more edges than that gets worse fast and is worth avoiding outright on a
character this size.

A five-pole is usually the safer of the two. It shows up naturally wherever two loops need to
merge, such as the side of a torso where you don't need as many vertical loops around a
narrower waist as you do around a wider chest. Placed on a flat or gently convex area that
never sits at the centre of a bend, a five-pole is close to invisible. This is the ordinary,
healthy way a low-poly character's loop count changes as it moves from a dense area to a
sparse one, and a mesh with no five-poles anywhere is more often a sign that every section was
built at the same uniform density than a sign of careful modelling; uniform density on a fixed
triangle budget usually means the joint zones are under-built to pay for it.

A three-pole is the one that causes visible pinching, because it pulls three edges into a
single point and the surrounding faces can't distribute a rotation evenly around it: one side
of the pole gets more influence than the other, and under a bend the surface puckers right at
that vertex. A three-pole belongs at the end of a symmetrical cap, somewhere that never bends,
tucked at the crown of a shoulder mass well clear of the joint itself, for example, never at
or near the centre of a hinge.

The rule that matters for rigging: wherever a pole sits inside or at the edge of a zone that
will bend, expect a pinch there regardless of how carefully you paint weights later. Weight
painting redistributes influence across the geometry that exists. It cannot invent geometry
that isn't there, and a pole is exactly a place where the geometry has less information to
redistribute.

The shoulder cap is where this shows up hardest on a small character. An arm built from an
eight-sided cylinder meets a torso that only needs four or five loops around a comparable span,
and that mismatch in loop count has to resolve into poles somewhere at the junction. Push the
poles up onto the flat of the shoulder mass, away from where the arm lifts, and the
resolution costs nothing visible. Leave them sitting in the crease where the arm meets the
torso, the exact spot that opens when the arm raises, and every pose from here on shows a
pinch that no later weight-painting session fixes, because the fix belongs in Edit mode, not
in Paint Skin Weights.

### Placing loops so a joint bends without collapsing

A joint needs a minimum of three parallel loops crossing its bend axis to hold a clean curve:
one loop roughly at the joint's rotation centre, and one flanking it on each side. The
flanking loops give the skin somewhere to compress on the inside of the bend and stretch on
the outside without the two collapsing into each other or the surface going flat between them.
Two loops, the common shortcut, is just enough to fold the limb in half: the inside of the
bend either caves inward past where it should stop, or the crease lands exactly on one edge
with no neighbouring geometry to round it off, and the bend reads as a sharp fold, not a
rounded joint.

Elbow and knee are single-axis hinges. Loops there should run perpendicular to the bend
direction, spaced evenly across a span wide enough that the crease has geometry both in front
of and behind where the joint visually reads as "the elbow" or "the knee," not centred on a
single loop with nothing either side of it.

Shoulder and hip are different in kind, not just in position. They rotate on more than one
axis, and the zone that deforms around them is a whole region converging toward the joint, not
a single hinge band. That's why shoulder and hip topology commonly uses loops whose spacing
tightens as they approach the joint, plus at least one loop that cuts
across the region diagonally (an "armpit" loop, the same idea at the hip), so the mesh isn't
relying purely on parallel rings to hold a joint that moves in every direction.

### Budget without destroying deformation

At 2,000 to 4,000 triangles for the whole character, including the head, there isn't slack to
spend evenly across the mesh. Spend where a joint bends: shoulder, elbow, hip, knee, each get
the loop density described above. Starve where nothing bends: the long midsection of an upper
arm or thigh, flat torso panels, the back of the head. Deleting a redundant loop from a long
uniform cylinder section costs nothing, because two adjacent loops there are carrying
identical information about the same silhouette. Deleting a loop from a joint zone to hit a
triangle count is the one cut that costs you later, because that's the one place every
triangle is doing work.

Add a loop when a surface visibly pinches or facets under a test pose (the diagnostic below
covers how to check this before rigging), or when the silhouette needs to hold a shape through
a bend that it currently can't, such as a slight crease behind a bent knee at rest. Delete a
loop when two neighbouring loops contribute the same information to the silhouette, or when a
loop was placed for a feature that turned out not to need independent motion.

A rough allocation for the full 2,000-to-4,000 triangle character gives you a number to build
against, so you aren't discovering the total only once the whole mesh is done: head and face
somewhere around 500 to 700, since a stylised low-poly head needs less than intuition
suggests once eyes and mouth read as simple flat shapes, not modelled geometry; torso, chest,
and hips together around 400 to 600, mostly flat panels with the loop density increasing at the
shoulder and hip sockets already described; each arm, shoulder through hand, around 250 to 350, weighted toward
the elbow and shoulder; each leg, hip through foot, around 300 to 400, weighted toward the knee
and hip. Two arms and two legs alone account for roughly half the total budget, which is the
concrete reason "spend at the joints, starve the long bones" matters more on a character this
small than it would on a higher-budget asset with room to spare everywhere.

### The tools, and the actual workflow

**Multi-Cut** is the general-purpose tool: it cuts a loop, a partial cut, or an arbitrary path
across faces in one live tool, and it's the fastest default for most edge additions. **Insert
Edge Loop** is faster specifically when you want one clean, full ring around a cylindrical
section and nothing more, since it guarantees a continuous loop in one action without the
branching Multi-Cut allows. **Bridge** fills the gap between two open edge borders with new
geometry, the tool you reach for joining a separately modelled hand onto an open forearm tube,
or closing a gap left by a deleted face. **Merge** (Edit Mesh > Merge, or the Merge tool with
a merge-distance value) welds coincident or near-coincident vertices, the cleanup step after a
Bridge or a boolean leaves doubled verts along a seam. **Target Weld** snaps one specific
vertex onto another, one pair at a time, when you need control over exactly which vertex
survives, a level of control a tolerance-based merge across a whole selection doesn't give you.
**Quadrangulate**
(Mesh > Quadrangulate) converts triangulated regions back to quads automatically, useful after
a boolean or an import leaves triangles, though it doesn't always find a good layout and
usually needs a manual pass after. **Cleanup** (Mesh > Cleanup) scans a mesh for problem
geometry (non-manifold edges, lamina faces, oversized n-gons, zero-area faces) and can select
or fix them, a pass worth running on the whole character once before rigging starts. The
**Modeling Toolkit** panel (Window > Modeling Toolkit) surfaces interactive versions of most of
these tools plus a live component count; turning it on early and leaving it open is faster than
hopping between separate tool dialogs for each operation.

The actual sequence, building a limb: block it as a simple cylinder first. Multi-Cut in the
three loops each hinge joint needs, positioned against where the joint will sit once you place
it (the rigging section below covers where that is; place the loops after you know, not
before). Where the cross-section changes, the wrist narrowing out of the forearm, the neck
narrowing under the head, use Insert Edge Loop for the transition ring itself, then Multi-Cut
to taper the flanking geometry into it, and Merge to clean up whatever doubled vertices the
taper leaves along the seam. Where two separately modelled pieces need to join, open both end
loops to matching vertex counts and Bridge across them; if the counts don't match, Target Weld
the extras down one at a time until they do, since Bridge needs equal counts on both sides to
produce clean quads. Run Cleanup on the finished character once before rigging, because a
stray n-gon or a sliver face sitting under a rig looks fine until the first pose that
moves it.

A second sequence, building the chest and neck: the chest is close to a box with rounded
corners, so it rarely needs a joint-density treatment the way a limb does, but it does need
enough loops around the neck opening to match whatever loop count the neck cylinder was built
with, or the join between the two becomes an unplanned pole cluster, not a deliberate
one. Multi-Cut the chest to add a loop around the neck opening matching the neck's loop count
before modelling the neck itself, then Bridge the two open rings together. Building the neck
first and the chest opening second more often ends in a vertex-count mismatch discovered only
at the Bridge step, one extra round of Target Weld that a few minutes of counting loops ahead
of time would have avoided.

### Diagnosing a mesh before you rig it

Check these before binding, because every one is far cheaper to fix in Edit mode than after a
skin cluster exists:

1. **Count the loops crossing each joint zone.** Fewer than three around any hinge (elbow,
   knee) is a problem before a single weight has been painted.
2. **Find every pole and check it against the joint centres.** Turn on wireframe, locate every
   non-four-valence vertex, and check whether any sit inside or at the boundary of a bending
   zone. If one does, it will pinch there under skinning no matter how the weights are
   painted, because the geometry itself carries only one loop's worth of information to
   distribute a rotation across.
3. **Check loop spacing around a limb's circumference.** Geometry lumped on one side and
   sparse on the other reads as a limb that wants to twist under rotation, because the thin
   side stretches further per face than the dense side does.
4. **Draw three parallel rings, by eye, across every joint's bend axis before moving on.** If
   you can't, that joint doesn't have enough topology yet. This is the fastest single check
   for a character this size and it catches most of the failures above before you've spent
   time on anything else.
5. **Rotate a duplicate of the mesh through a joint's full range before a rig exists.** Group a
   copy of the arm or leg mesh under a locator, parent-constrain nothing, and just rotate the
   locator by hand through the angle the joint will eventually cover. A straight loop that
   turns into a jagged zig-zag under that rotation is the visual signature of a bend with too
   little geometry behind it, and it's visible with no skin cluster involved at all, which
   means it's cheap to find and cheap to fix before binding commits you to a specific mesh.

None of these five checks require a finished rig, and that's the point of running them here.
The whole reason topology comes before rigging in this document is that every one of these
problems is an Edit mode fix when caught at this stage: a Multi-Cut, an Insert Edge Loop, a
few minutes moving a pole. Caught after Smooth Bind, the same problem turns into a
weight-painting session that fights the mesh and never quite fixes it, and caught after four
animation clips are keyed, it's a rebuild that touches everything downstream of the mesh. The
five checks above take a few minutes against the hours a late discovery costs.

## Rigging: joints, orientation, binding, and the two places it always breaks

### Joint placement: the centre of rotation, not the skin

A joint's transform is the pivot every skinned vertex around it rotates about. The temptation
is to place a joint at the visible crease on the skin, the surface fold your own elbow makes
when you bend it. That crease is not the joint's actual anatomical centre, the point the bones
inside articulate around, and the two can sit a real distance apart. Place the joint at the
crease and the geometry on the far side sweeps through a much wider arc than it should relative
to the near side, because it's rotating around a pivot that sits off-axis from where the real
joint is. No amount of weight painting corrects this. Weight painting distributes influence
across the geometry you have; it can't move the mathematical centre of a rotation, which is
set once, at the joint, when you place it.

For elbow and knee, the joint sits on the limb's central axis, at roughly the depth where the
two bone segments articulate: close to the visible crease when the arm bends,
but not assumed to be exactly on it. For shoulder and hip, place the joint further inside the
body mass than intuition suggests: inside the torso for the shoulder, inside the pelvis for
the hip, near where the ball of the actual joint rotates, not out at the surface bump that
reads visually as "the shoulder."

Placing a joint accurately in Maya is a snapping problem, not a freehand one. Draw the chain
roughly with the Joint Tool first, then select a joint and drag it with point snapping on
(hold V) against a vertex you've placed deliberately at the intended rotation centre, or
against a locator parked there in advance if no vertex sits exactly where you want it. Moving
a joint after a mesh is already skinned to it drags the bind pose with it in a way that rarely
matches what you intended, so get placement right before Bind Skin, not after: a joint you
move post-bind needs its skin cluster's bind pose reset (Skin > Edit Smooth Skin > Move Skin
Joints Tool, or a full unbind and rebind for anything more than a small nudge) or the mesh
tears away from the joint the first time it rotates.

### Joint orientation: why an unoriented chain feels broken

Every Maya joint carries two separate rotation values: **jointOrient**, a fixed per-joint
offset baked into its local axes at creation time and never animated, and **rotate**, the
channel animation and posing drives. Drawing a chain with the Joint Tool auto-orients
each joint's primary axis down the bone toward its child, which is usually right. The
secondary and tertiary axes are where chains commonly disagree from joint to joint. That
disagreement grows once the chain bends through three dimensions and no longer runs in a
straight line.

When one joint's local axes don't agree with its neighbour's, the same rotation channel means
something different at each joint. Driving Rotate Z on the shoulder might flex it forward
while the identical channel at the elbow twists it sideways, and the whole arm stops
following a single control and starts fighting the animator. This gets worse, not better,
once IK enters the picture, because a single control then has to drive rotation across joints
whose axes were never agreed on to begin with.

**Orient Joint** (Skeleton > Orient Joint, option box) fixes this: set a Primary Axis (commonly
X, pointing down the bone toward the child) and a Secondary Axis (commonly Y or Z, aligned to
a consistent world-up direction), then run it across the chain from the root down. Don't trust
the result on sight. Verify it: select the chain, **Display > Transform Display > Local
Rotation Axes** to draw each joint's actual XYZ gizmo in the viewport, then check that the axis
you intend to drive a bend with points the same rotational direction, relative to the limb, at
every joint in the chain. Shoulder and elbow should show the same colour axis making the same
turn. If one joint's gizmo looks rotated against its neighbours, re-run Orient Joint with a
different secondary axis or world-up setting. Don't hand-rotate the joint to compensate.
A hand rotation to fix an orientation problem leaves a non-zero value sitting in that joint's
Rotate channel at bind time, which is exactly the kind of leftover the export section below
flags as a source of an extra twist appearing after the FBX round trip.

A concrete pre-bind test, before a mesh is anywhere near this chain: select the elbow joint
alone and type a rotation of, say, negative 60 on whichever axis you intend as the bend axis.
Watch the elbow child joint (the wrist) swing through a plane that matches how a real elbow
bends, a single clean arc in one plane. If it swings on a diagonal, or the forearm corkscrews
along its own length without folding cleanly, the secondary or tertiary axis
disagrees with what the primary axis alone would suggest, and Orient Joint needs another pass
before you build anything on top of this chain. Do this joint by joint down the whole arm and
leg before modelling a single loop of skin around them; catching a bad orientation on a bare
joint chain costs one re-run of Orient Joint, while catching it after skinning costs a rebind.

### Naming and mirroring

Use `_L` and `_R` suffixes, the same convention the companion Blender guide's naming list
uses: `shoulder_L`/`shoulder_R`, `arm_L`/`arm_R`, and so on down the paired joints. Naming
matters less for **Mirror Joint** itself, which works by reflecting a selected chain across a
plane and renaming the copy with a search-and-replace string pair you type into its option box
(search `_L`, replace `_R`), a plain string substitution that tolerates an inconsistent name
just fine. It matters for everything that reads the name afterward: any script, any export
step, and you, months from now, debugging a weight problem by joint name and finding one
spelled or capitalised differently from the rest.

Build the full left side first, orientation verified, before mirroring. Select the root of
that side (`shoulder_L`), **Skeleton > Mirror Joint**, option box: **Mirror Across** set to the
plane that separates the character's left and right in your scene (check which plane
that is; don't assume YZ, since it depends on which way you modelled the character facing),
and **Mirror Function** set to **Behavior**, not **Orientation**. This distinction is the one
that matters: Behavior flips the mirrored joint's orientation so a positive rotation
on the right produces the mirror image of the same positive rotation on the left, meaning one
animation curve drives both sides symmetrically. Orientation mirroring copies the raw axes
without flipping behaviour, so a positive rotation on the right does the visual opposite of the
same value on the left, a result no biped rig wants. After mirroring,
test one joint on each side with a matching rotation value and confirm both sides move the same
way relative to the body, not mirrored wrong.

Check the mirrored chain's Translate values too, not only its rotation behaviour. A joint
mirrored correctly across the YZ plane should show its Translate X negated against the source
joint's value, with Translate Y and Z unchanged, assuming the source chain was itself built
with all its offsets sitting cleanly on one axis. A mirrored joint with an unexpected value on
Y or Z as well points at a chain that wasn't built flat against the mirror plane to begin with.
Mirror Joint reflects that asymmetry faithfully; it doesn't fix it. Catch this before rigging
continues, since a skeleton that isn't truly symmetric turns every subsequent weight and pose
decision into two separate decisions, one per side, when a properly mirrored chain would have
let one decision serve both.

### Binding: Smooth Bind and what its options do

Select the mesh, then the root joint, then **Skin > Bind Skin**, option box. Don't accept the
defaults blind; each option changes what the initial weights look like, and getting them
closer to right up front is less weight-painting work later.

**Bind to** decides whether Maya binds the whole hierarchy under the joint you selected or only
the explicitly selected joints. For one continuous skeleton like this, binding the whole
hierarchy from the root guarantees nothing gets left unbound by accident.

**Bind method** decides how Maya distributes starting weight. Closest Distance weights purely
by proximity in space, fast but noisy anywhere two joints sit physically close but far apart in
the hierarchy, the hip and the opposite thigh being the obvious case here. Closest in Hierarchy
limits candidate influences to joints nearby in the skeleton's structure, a safer default for a
simple biped because it stops the opposite thigh from picking up weight near the hips at all.
Heat Map diffuses weight from each joint across the mesh surface through a slower simulation
step, and it tends to produce a noticeably cleaner starting result exactly at the junctions
where several joints' influence overlaps: the shoulder and the hip, the two zones this
document already names as trouble spots. Geodesic Voxel weights by mesh surface distance,
not raw 3D distance, built for characters with separate or overlapping meshes (clothing over a
body), overkill for one continuous low-poly mesh. Given a rig this size with known problem
zones, Heat Map is worth the extra bind time over Closest Distance.

**Skinning method** decides how bound weights combine to move a vertex at pose time. Classic
Linear (linear blend skinning) blends every influencing joint's transform by weight, the
oldest, simplest, and only one glTF's skinning model can express. Dual Quaternion fixes the
"candy wrapper" twist that linear blending produces on a tightly twisted limb, at the cost of
sometimes losing volume at a wide bend, a different failure mode, not a strictly better one.
Weight Blended lets you paint which method each vertex uses, a Maya-only feature with no glTF
equivalent: whatever you paint, the export flattens it back to Classic Linear regardless. Given
that flattening, pick Classic Linear from the start and solve the candy-wrapper problem with
topology (the three loops at the forearm from the previous section) and weight painting.
Don't build around a mode that won't survive the trip through FBX.

**Max Influences** caps how many joints can weight one vertex. Capping to three or four on a
low-poly, 2,000-to-4,000-triangle character keeps the exported skin data smaller and keeps
weight painting comprehensible: five overlapping influences on a single vertex is hard to
reason about when you're trying to work out which joint is causing a specific pinch.

**Dropoff rate** controls how sharply weight falls off away from a joint's direct area under
distance-based binding. Leave it at the default unless one joint's initial bind is bleeding
weight much further across the mesh than the others.

### Weight painting as a diagnostic loop

Paint after posing, not from a neutral bind pose on spec. Rotate the joint in question through
a representative bend first, look at exactly where the mesh pinches, balloons, or facets, then
open **Skin > Paint Skin Weights** on the specific joint responsible and paint corrections
while the pose stays put, so every stroke shows you immediately whether it fixed the actual
problem in front of you. Painting from a neutral pose hides the exact deformation you're trying
to solve.

Replace sets a vertex's weight for the selected influence to the brush value directly; used
carelessly it can throw off the rule that a vertex's weights sum to one across all its
influences, though Maya's auto-normalize (on by default) rebalances the other influences on
that vertex to compensate. Add and Smooth are more forgiving for iterative correction. Smooth
is the right tool for a harsh, faceted crease, since it averages a vertex's weight
against its neighbours and removes the sharp jump in influence that produces a sharp jump in
shape.

Worked through once, concretely: bend the elbow to 90 degrees. The inside of the fold shows a
hard facet, two faces meeting at a sharp angle where a rounded curve should sit. Select the
elbow joint in the Paint Skin Weights tool's influence list; the display paints the mesh white
where the elbow holds full weight and black where it holds none, with grey in between. A hard
facet under a bend usually shows as a hard edge in that white-to-black gradient too, a jump
from pale grey to white over one row of vertices, not a spread across two or three. Set the
tool to Smooth, a low value, and stroke across that boundary a few times, checking the pose
after every few strokes. Don't hold the brush down and hope. The facet softens into a curve as
the gradient spreads across more vertices. If it doesn't soften no matter how much Smooth you
apply, the boundary has nowhere to spread into: the topology diagnostic's three-loop rule is
showing up here as a rigging symptom now, a modelling problem, not a weighting one. Go back to
Edit mode, add the loop, then rebind.

### The shoulder and the hip, by name

At the shoulder, the common failure is the underarm pinching into a sharp crease the moment the
arm lifts, because chest, shoulder, and arm joints all claim overlapping vertices in the armpit
and distance-based binding tends to draw a hard boundary there, not a gradient. With the
arm raised, paint the underarm vertices to blend shoulder and arm influence gradually across the
crease. If the topology diagnostic already flagged this zone as having too few loops to carry a
gradient, that's the real cause, and no amount of paint fixes a crease that has one edge loop to
distribute the change across. Go back and add the loop; this is exactly why topology comes
before rigging in this document.

At the hip, the equivalent failure is the inner-thigh area pinching, or worse, the opposite
thigh's joint bleeding weight onto the wrong leg entirely, since distance-based binding sees the
two thighs as physically close even though they're unrelated in the hierarchy. With one leg
lifted, select the wrong-side thigh joint in Paint Skin Weights and check the planted leg for
any non-zero influence from it. Paint it to zero and let Maya's normalize option rebalance the
remaining, correct influences back to summing to one.

### IK versus FK

Idle, run, climb, and lean don't ask an arm to hold a fixed position while the body moves
around it, so FK is enough on both arms: the arm's job across all four clips is to swing with
the body, and FK gives an animator direct control over that swing without a solver in the way.

The legs are where IK earns its place, for run and climb specifically. IK on a leg lets you
control the foot's contact position directly, pinning it to a ground plane during a run's
stance phase or to a ladder rung during a climb, and letting the hip and knee solve to reach
it, which is what both clips need. Use the **Rotate-Plane (RP)** solver on each leg
(Skeleton > IK Handle Tool, click the hip, click the ankle), not Single Chain: RP gives you a
pole vector to control which direction the knee points independently of the foot's position,
essential for a two-bone knee, since without a pole vector the knee's bend direction is
ambiguous and can flip as the foot moves. Single Chain has no pole vector and suits a simpler
mechanical chain, not a knee. Spine, chest, neck, and head stay FK; nothing in this project
needs to reverse-solve a spine position from a target.

Set up the pole vector deliberately. Don't accept wherever Maya defaults it: create a
locator a short distance in front of the knee, roughly where the knee itself points at a
natural standing pose, then select the locator and the IK handle and apply **Constrain > Pole
Vector**. A pole vector placed behind the leg or off to one side pulls the knee's bend
direction into an unnatural twist the moment the leg starts moving, a problem that looks like a
skinning fault but comes from a badly placed control object, with nothing wrong in the mesh or
the weights at all. Test it the same way the orientation check works: drag the IK handle
through a rough approximation of the run cycle's leg travel and confirm the knee stays pointed
forward throughout, not just at the single pose it happened to look right in when you set the
pole vector up.

A fifteen-bone rig covering four short clips does not need Full Body IK, IK/FK blending, or a
spline spine. That's complexity built for a much larger character budget than this one.

### Testing the rig before you animate anything

Pose every joint through its full range, one at a time, before writing a single animation
curve. For elbow and knee, bend to the full limit and check for collapse: the inside of the
bend caving in and losing volume, not compressing gently. Rotate the forearm around its
own long axis, the twist axis, not the hinge, through a full range and watch for the
candy-wrapper pinch at the middle of the segment; expect some under Classic Linear skinning at
the extremes and treat it as something to fix, not a surprise. Raise the arm to at least
shoulder height and check the underarm doesn't hollow out and the shoulder cap doesn't spike.
For shoulder and hip, test the full cone of rotation, not one axis: a rig that looks fine bent
forward can still fail bent sideways. Finding these problems now, before four clips are keyed
against the rig, is far cheaper than finding them after.

Extend the pass to spine, chest, and neck too, even though nothing in these four clips asks
for a dramatic bend there. Roll the chest a few degrees each way and check the waist doesn't
pinch the same way an unfinished elbow would; twist the neck and check the collar doesn't tear
where it joins the chest. These joints get less topology attention than the limbs precisely
because they move less, but "less" isn't "none," and a run cycle's counter-rotation through
the spine and a lean's held pose both put real rotation through this chain.

A temporary striped or checker texture, swapped in over the palette material for testing only
and swapped back before export, makes twist problems far easier to see than the flat kit
colours do: a candy-wrapper pinch shows as the stripes visibly bunching and crossing near the
middle of a twisted segment, obvious at a glance where the same problem on a flat grey surface
is a subtle darkening you have to look for. Ten minutes with a checker pattern at this stage
catches more than a long stare at the untextured mesh does.

## The palette texture, adapted to Maya

The idea carries over from Blender exactly: build one small image of flat colour swatches,
point every prop's faces at a swatch, and skip real UV unwrapping entirely, since a flat colour
returns the same sample no matter how the UV island is shaped or scaled. One material, one tiny
image, the whole kit batches into few draw calls, which is what the under-30-draw-call
budget depends on.

Build the swatch image externally (any 2D editor, 64x64 pixels, an 8x8 grid of flat 8x8-pixel
colour blocks, no anti-aliasing) and bring it into Maya's Hypershade. Create one Lambert (or
Blinn) material, name it something shared across the whole kit, and wire the swatch image into
its Color input through a File texture node. Assign this same material, the same node, to every
prop by picking it from the material list. Don't create a new one per prop; a duplicate
material defeats the batching this whole technique exists for.

Set the File node's **Filter Type** (in its Effects section of the Attribute Editor) to **Off**.
This is Maya's equivalent of Blender's Closest interpolation step: with filtering on, a UV
coordinate near a swatch boundary can sample a blend of two swatches, a soft seam exactly where
you don't want one, since every UV island in this technique is collapsed toward a swatch centre
but floating-point rounding can still land a sample near an edge. With filtering off, every
sample returns the exact colour of the nearest texel, full stop.

Per prop, per face group that should read as one colour: do a trivial unwrap (Maya's own
Automatic mapping is fine, since the layout gets thrown away), select the target faces in
component mode, open the UV Editor, scale the selected UVs down to a single point, and move
that point onto the target swatch's centre using the UV Editor's numeric coordinate fields;
typing the value beats eyeballing it against the grid. Each swatch occupies one eighth of UV space per
axis, so swatch column `c`, row `r` centres at `((c + 0.5) / 8, (r + 0.5) / 8)`. Confirm which
direction Maya's UV Editor counts rows before typing a coordinate; getting it backward silently
selects the swatch mirrored across the image, and nothing flags the mistake until a prop turns
out the wrong colour.

## Prop conventions

**Pivot at base centre.** For every prop, move its pivot to the horizontal centre of its
footprint, at the point where it touches the floor: Insert (or D, depending on your hotkey
set) toggles pivot-edit mode, and snapping to a vertex there with point snap on gives an exact
result. This is what lets code place a prop with one position value and have it sit correctly
on the floor with no per-prop offset.

**Freeze transforms and delete history before export.** Modify > Freeze Transformations bakes
the current position, rotation, and scale into the object so its channels read `0,0,0` /
`0,0,0` / `1,1,1`, with the actual shape living entirely in the mesh data. Delete construction
history (the Delete History command on the Status Line, or Edit > Delete by Type > History)
clears whatever operations built the mesh. Skip either step and an un-applied scale carries
through export invisibly: the prop still looks right in isolation, but a bounding-box
calculation done anywhere downstream, in a kitbashing tool or in code that reasons about a
prop's size, reads a number scaled by whatever you forgot to freeze. Make both steps a habitual
last move before every export, every prop.

**Naming**, exactly, matching the shared kit regardless of which tool built it:

```
prop_bed
prop_desk
prop_shelf
prop_screen
prop_crate
prop_wheel
prop_door
prop_rug
prop_chair
prop_window
```

**Model to the grid.** Whole units, halves, quarters, matching the grid spacing from Scene
setup above. A crate at exactly 1x1x1 and a chair seat at exactly 0.5 tall snap together
predictably when a room gets kitbashed from the shared kit; odd, un-round dimensions look fine
alone and visibly fail to align the moment they meet the rest of the kit.

## Animations

Four clips: idle, run, climb, lean, matching the design spec's set, no more. Frame ranges
below assume 24fps, Maya's default film rate (confirm under Preferences > Settings > Time):

- **Idle:** frames 1 to 48, a two-second loop with frame 48 matching frame 1 exactly so the
  cycle shows no pop on repeat. Keep it subtle: a weight shift, a breath. This plays whenever
  a room's character sits idle on screen, so it's the clip a visitor spends the most time
  looking at doing nothing else, which is also why it's hand-animated regardless of what else
  gets sourced elsewhere.
- **Run:** frames 1 to 24, one cycle per second at 24fps, looping frame 24 back to frame 1.
  Standard run-cycle structure: contact, down, passing, up, then the same sequence on the
  opposite leg starting at frame 13.
- **Climb:** frames 1 to 32, paced to one cycle per ladder rung, not to a fixed loop
  time, since traversal speed on the ladder drives how many cycles play per floor. That speed
  isn't in the codebase yet; `src/lib/house/character.ts` doesn't exist. Treat any specific
  speed number as a planned target until that file lands, not a verified constant.
- **Lean:** frames 1 to 16, a one-shot, not a loop, holding the final pose (leaning into
  a doorway as the camera pushes in). It plays once per room entry and holds; don't loop it.

Evaluate Mixamo for the run cycle only, never for idle, climb, or lean. Mixamo retargets motion
onto adult-proportioned reference skeletons, and this character is a stylised child with a
larger head-to-body ratio and shorter limbs; a retargeted adult run can slide at the feet or
swing the arms through too wide an arc for the shorter limb length. Judge a Mixamo pass against
the actual rig before trusting it, and hand-animate the run too if it reads wrong.

## The export path in full

### Maya FBX export settings

File > Export All (or Export Selection), file type FBX, option box.

- **Version:** a stable FBX version, not the newest one available (2018 or 2020
  binary is a reasonable default), since Blender's FBX importer support for the newest
  FBX SDK release tends to lag behind Maya's exporter. If Blender's importer errors or drops
  something on the first attempt, dropping the FBX version down one step in this dropdown is
  the first thing to try before assuming a deeper problem.
- **Geometry:** Smoothing Groups on, so Blender's importer reconstructs hard and soft edges
  correctly, not an all-smooth or all-faceted mesh. Smooth Mesh Preview off;
  this kit's low-poly look never bakes a subdivision preview. Tangents and Binormals off,
  since nothing in this pipeline uses normal maps. Leave geometry as quads where the exporter
  allows it; Blender's own tools and its glTF exporter both handle the triangulation step
  themselves at the final stage, so there's no reason to triangulate early and lose the quad
  layout the topology section spent this much effort building.
- **Units:** confirm the working unit is Meter (from Scene setup above) before export, and
  don't let an automatic unit-conversion checkbox apply a factor you didn't intend. After the
  first export of any file, re-import it into a scratch Blender scene and check the object's
  Scale reads `1, 1, 1` before doing anything else with it. That single check catches the most
  common failure in this whole pipeline before it costs a debugging session later.
- **Axis:** leave Up Axis at Y. Maya's own world is already Y-up, matching both FBX's usual
  convention and glTF's target, so there's no compensating rotation to add here.
- **Animation, character file only:** Bake Animation on, Resample All on, so any IK-driven
  joint motion (the leg IK from the rigging section) gets baked to keyed rotations on every
  frame. FBX doesn't carry the IK solver's construction history across applications reliably. Set the bake range to cover all four clips, or export each
  clip separately; either way, verify the resulting Blender Action or NLA strip against the
  frame ranges above once imported. Skins on, Blend Shapes off (this rig doesn't use any).
  Leave Animation off for the prop kit and the house shell; neither has anything to bake, and
  an empty animation track is wasted bytes against the 2.5 MB budget.

### What breaks, and the fix for each

**Scale.** A unit mismatch between Maya's working unit setting and the FBX exporter's
assumption bakes an unwanted 0.01 or 100 multiplier onto the exported hierarchy. Fixed by
setting Working Units to Meter before modelling starts and confirming Scale reads `1, 1, 1`
after every import into Blender, not after the whole pipeline is built.

**Joint orientation.** Maya's jointOrient and rotate split has no direct Blender equivalent;
a Blender bone encodes both into a single rest orientation plus roll. FBX bakes Maya's two
values into one effective per-joint transform, which usually imports as the correct rest pose.
The risk sits in any joint left with a non-zero value in its Rotate channel at bind time,
a value that Orient Joint should have folded fully into jointOrient. That leftover
imports as an ambiguous extra twist Blender can't distinguish from an intended animated pose.
Fixed by running Orient Joint properly and verifying with Local Rotation Axes, per the rigging
section. Don't hand-rotate a joint to patch an orientation problem.

**Custom normals.** Maya's Lock Normals and hand-edited vertex normal workflow has no clean FBX
path into a glTF-consuming pipeline and commonly imports faceted or seamed. Fixed by not using
it: rely on ordinary Harden Edge and Soften Edge, which round-trips through FBX's Smoothing
Groups setting reliably, and this kit's flat palette shading has no use for hand-edited normals
anyway.

**Non-uniform scale on joints.** glTF's skinning model and Blender's bones both assume uniform
joint scale, and Maya's Segment Scale Compensate attribute, which lets a scaled parent joint
avoid scaling its children, has no equivalent on the other side of this pipeline. Fixed by
freezing every joint's scale to a uniform `1, 1, 1` and not relying on Segment Scale Compensate
for any visual effect in a rig this size; if a limb needs to taper, do it in the mesh and the
weights, not with a scaled joint.

### Checking the FBX in Blender, before touching glTF export

1. **File > Import > FBX**, with **Automatic Bone Orientation** off, so Blender trusts the
   orientation Maya's Orient Joint tool and the FBX bake already established. Left on, Blender
   recomputes bone roll from the mesh, which can quietly disagree with the orientation the
   rigging section spent time getting right.
2. Check the imported object's **Scale** in the N-panel reads `1, 1, 1` (or another clean,
   expected value) immediately. This is the fastest way to catch a unit-conversion problem
   from the FBX step.
3. In Pose Mode, enable the armature's local axis display (Armature Properties > Viewport
   Display > Axes) and rotate a couple of test joints, the same verification done in Maya
   after Orient Joint, since a bad Primary/Secondary Bone Axis mapping in Blender's FBX
   importer shows up here, independent of whatever was correct on the Maya side.
4. Reassign materials by hand: strip whatever Maya's Lambert or Blinn assignments became on
   import and assign the shared `kit_palette_material` from the companion Blender guide's
   palette section. Don't trust a one-to-one material round trip; Maya materials
   rarely translate to a usable glTF material without rebuilding them in Blender's Shader
   Editor regardless.
5. Check shading against what the Harden/Soften edges in Maya intended; Blender 4.x manages
   this through a Smooth by Angle modifier in some versions, not a flat smoothing
   toggle, so look at the actual result. Don't assume the FBX import wired it up
   correctly.
6. From here, the glTF export settings are exactly Section 7 of the companion Blender guide:
   glTF Binary (`.glb`), **+Y Up** on, Apply Modifiers on, UVs and Normals on, Tangents off,
   Draco compression at level 6. Blender's exporter performs its own Z-up-to-Y-up conversion
   at this step regardless of the source file's original up axis, so this happens the same
   way whether the FBX came from Maya's Y-up world or anywhere else.

One Maya scene, one FBX export, one Blender import, one glTF export: three files out of this
whole pipeline (prop kit, character, house shell), each checked in Blender before it's trusted,
the same three-file split the Blender guide's Section 7 describes.

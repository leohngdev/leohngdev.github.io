# Blender production guide: the house art kit

Written for Phase 1 of `docs/superpowers/specs/2026-07-31-portfolio-house-design.md`, before
any modelling starts. You (Leo) know modelling, UVs, rigging, skinning and animation as
concepts from Maya. This document does not re-explain those concepts. It tells you where
Blender put the equivalent button, what Blender calls it, and where Blender's habits differ
from Maya's in ways that will cost you time if you don't know about them going in.

**Version described:** Blender 4.2 LTS. Blender's menu layout has moved between major
versions before and will again. Where a path is likely to drift, that is called out inline.
When something on your screen does not match what is written here, press **F3** and type
what you are looking for (for example "clip", "automatic weights", "statistics") rather than
hunting menus by hand. F3's search is a reliable constant across versions even when a menu
location is not, and it is the fastest way to confirm this document is still accurate for
whatever version you actually have installed.

**The code is the source of truth for every dimension in this document.** Every number below
was checked against `src/lib/house/grid.ts` and `src/lib/house/scene.ts` on the
`direction-decision` branch. If the code changes after this is written, the code wins and this
document is stale until someone updates it.

## Hard numbers, from the code

- **1 Blender unit equals 1 world unit.** No rescaling anywhere in the pipeline.
- `CELL_WIDTH = 10`, `CELL_HEIGHT = 7` (`src/lib/house/grid.ts`).
- `ROOM_DEPTH = 6`, structural wall thickness `WALL = 0.3` (`src/lib/house/scene.ts`).
- One room's usable volume is therefore **10 wide, 7 tall, 6 deep**, with `WALL` (0.3 units)
  eaten from the shared edges between adjacent cells so neighbouring floors and back walls
  don't touch.
- Six rooms in a 3-wide by 2-tall grid on desktop, re-flowing to 1-wide by 6-tall below a
  768px viewport (`PHONE_BREAKPOINT` in `grid.ts`).
- **Row 0 is the TOP row and holds the earliest rooms. Time runs downward.** In world space,
  row 0 sits at Y = 0 and every row below it has more negative Y (`worldPositionFor` in
  `grid.ts`). The character descends through the house as the story moves forward: room 01
  (2013, the bedroom) is top-left, room 06 (now, the desk) is bottom-right on desktop and last
  in the tower on phone. Dress and light rooms with this in mind: later rooms should read as
  "deeper," not "higher."
- Budgets: **200 to 800 triangles per prop**, **2,000 to 4,000 for the character**, **under
  100k triangles for the whole scene**, **under 30 draw calls**, **under 2.5 MB for all scene
  assets compressed**. The triangle numbers are generous on purpose. Draw calls and download
  size are the real constraints; see Section 4.

---

## 1. Scene setup

Do this once, save it as your startup file, and never repeat it per asset.

**Unit system and scale.** Open the **Scene Properties** tab (the icon is a small printer/cone
cluster, near the bottom of the Properties editor's vertical tab strip) and find the **Units**
panel. Set:

- **Unit System:** Metric
- **Unit Scale:** `1.0` (the default; leave it alone)
- **Length:** Meters (this is a label only and does not rescale anything as long as Unit Scale
  stays at 1.0)

**Maya-to-Blender trap #1.** Maya's default scene unit is centimetres. Blender's metric default
is metres, and this project treats 1 Blender unit as 1 world unit, matching `CELL_WIDTH` and
`CELL_HEIGHT` directly with no conversion factor anywhere in the three.js code. If you carry
over a "think in centimetres" habit and start scaling props down by 100 out of instinct, every
prop will be 100x too small next to a 10-unit-wide room, and grid snapping will stop lining
anything up. Model at face value: a crate that should read as roughly waist-high on the kid is
about 1 Blender unit tall, not 100.

**Grid snapping.** The magnet icon in the 3D viewport header toggles snapping; the dropdown
beside it sets the snap target (Increment, Vertex, Edge, Face, Volume). For kitbashing props to
a shared grid, use **Increment**. One caveat, stated honestly because I'm not fully certain of
the exact control surface in every 4.x point release: Blender's Increment snap size is derived
from the scene's Unit Scale and the current viewport zoom (it subdivides adaptively as you zoom
in), not from a single typed "0.25" field you set once in a properties panel. If you need an
exact, version-proof way to place something at a 0.25-unit increment regardless of snapping
settings, press G (or S, or R), then type the number directly, for example `G X 0.25 Enter`.
Numeric transform input is always exact and ignores snap settings entirely. Use Increment snap
for interactive kitbashing by eye, and numeric entry when you need a guaranteed value. To
confirm the current snapping options in your installed version, F3, then "snap", lists
everything available.

**Viewport clipping.** Press **N** in the 3D viewport to open the side panel, then the **View**
tab. Two fields: **Clip Start** (default `0.01`) and **Clip End** (default `1000`), both in
Blender units. At this project's scale, the whole six-room shell is roughly 30 units wide by 14
tall by 6 deep, so Clip End's default of 1000 is never a problem; you will not zoom out that far
modelling one house. The trap runs the other way: when you zoom in tight to detail a small prop
(a door handle, a hinge, anything under about half a unit), you can get closer to it than Clip
Start allows, and the near plane slices a visible chunk out of the mesh. It looks broken when
it's only clipped. Drop Clip Start to something like `0.001` before close prop detailing, and
put it back afterward, since an unnecessarily small Clip Start can introduce visible z-fighting
at distance.

**Saving this as a startup file.** Once units, snapping defaults and clipping are set the way
you want them for this project, go to **File → Defaults → Save Startup File**. This is a
top-level menu on the File menu, not buried in Preferences. Every new file you open afterward
starts from this configuration. I'm confident this is the current menu path in 4.x. Older
Blender versions also bound a keyboard shortcut for it, Ctrl+U, but I'm not certain that
binding still exists in 4.2 by default, so use the menu rather than relying on the hotkey.

**Maya-to-Blender trap #2: Z-up vs Y-up, and what it means for export.** Blender's world is
Z-up (Z is vertical). glTF, and by extension three.js, is Y-up (Y is vertical). Do not manually
rotate your models to Y-up inside Blender to pre-correct for this. Blender's own tools (walk
navigation, gizmos, the floor grid, physics if you ever use it) all assume Z-up, so a model
built rotated to Y-up fights every one of them and looks wrong in your own viewport. Model
naturally in Blender's Z-up orientation. The glTF exporter has a dedicated **+Y Up** checkbox
(covered in Section 7) that performs the axis conversion at export time, so the `.glb` file that
reaches three.js is correctly Y-up without you ever having built the source file that way.

---

## 2. The palette atlas, and why there is no UV unwrapping

This is the single biggest time saver in the whole kit, so it gets the most space here. The
idea: instead of unwrapping every prop's UVs and painting or photographing a texture for it, you
build one tiny image of flat colour swatches once, and every prop just points its faces at a
swatch. No seams, no unwrap, no texture painting per prop, one material for the entire kit.

### Why this works

A UV coordinate just says "sample the texture here." If the texture at that location is a flat,
solid colour with no gradient, it does not matter how big or distorted the UV island is, or
whether it's stretched, rotated or a single point: every sample inside that swatch returns the
same colour. That is the whole trick. You don't need real unwrapping because you're never
displaying detail, only a flat colour. Every prop that references this one image and one
material can be merged by the renderer into very few draw calls instead of one draw call per
prop, which is what Section 4's 30-draw-call budget is actually about.

### Step 1: Create the palette image

Work in the **UV Editing** workspace tab (top of the Blender window) so you have an Image
Editor visible. In the Image Editor: **Image → New**.

- **Width / Height:** 64 x 64
- **Color:** anything; you'll overwrite it. Black with alpha off is fine.
- Name it something you'll recognise later, for example `kit_palette`.

Lay the swatches out on an 8x8 grid, so each flat colour swatch is an 8x8 pixel block within
the 64x64 image and there are 64 possible swatches (you'll use far fewer: one per material
category such as wood, metal, fabric, skin, and a couple of accent colours).

**How to actually fill the swatches.** The most reliable, lowest-ambiguity method is to build
this image in any ordinary 2D image editor (even MS Paint, with anti-aliasing off) at exactly
64x64 pixels, painting flat 8x8 pixel squares with no gradients or feathering, and save it as a
PNG. Then in Blender, either **Image → Open** in the Image Editor, or in the Shading workspace
add an **Image Texture** node and **Open** the file from there. Building it externally sidesteps
any ambiguity about Blender's own paint-fill tools and guarantees pixel-perfect flat blocks.

If you'd rather stay inside Blender: the Image Editor has a mode dropdown (top-left of the
editor, next to the editor-type icon) with a **Paint** mode, which gives you brush tools
including a fill tool you can use to bucket-fill regions of the image directly without needing
a 3D mesh. I'm less certain of the exact current name and icon for the fill tool in 4.2. If you
go this route, F3, then "fill", inside the Image Editor in Paint mode should surface it. Getting
crisp 8x8 pixel blocks this way requires zooming the image editor in enough that you're not
fighting brush softness. The external-editor route avoids this entirely and is what I'd
recommend unless you specifically want to stay inside Blender.

### Step 2: Set interpolation to Closest

This is the step that is easy to skip and breaks everything subtly if you do. In the **Shading**
workspace, select a material that uses the palette image and find its **Image Texture** node in
the Shader Editor. The node has an **Interpolation** dropdown, defaulting to **Linear**. Change
it to **Closest**.

Linear interpolation blends between neighbouring texture pixels, which means any UV coordinate
sitting near a swatch boundary samples a blend of two swatch colours instead of one flat colour,
a soft, blurred seam exactly where you don't want one, since your UV islands are collapsed to
tiny points near swatch centres (Step 3) but floating point and mip-mapping can still land a
sample near an edge. Closest picks the nearest texel with no blending, so every sample inside a
swatch returns that swatch's exact colour regardless of where inside it the UV coordinate lands.
Do this once on the master material; every prop that shares the material inherits it.

### Step 3: Assign faces to a swatch

Per prop, per face group that should be one colour:

1. Model the prop and do a trivial UV unwrap, a Smart UV Project or even the default cube UVs
   are fine, since you're about to throw the layout away. You still need some UV data to work
   with; you're not skipping UVs entirely, you're skipping the part where the layout has to be
   accurate or non-overlapping.
2. In Edit Mode (**Tab**), switch to face select (**3**), and select the faces that should share
   one swatch (for example all the faces of a prop's wood parts).
3. Open the UV Editor (visible in the UV Editing workspace) alongside the 3D viewport. With
   **UV Sync Selection** enabled (small icon, top-left of the UV Editor, showing two paired
   arrows), your face selection in the 3D viewport is mirrored as a UV vertex selection in the
   UV Editor automatically.
4. In the UV Editor, with those UVs selected, press **S** then **0** then **Enter** to scale the
   selected UV island down to a single point. Because the swatch is a flat colour, collapsing
   the island to a point loses no information; there is no detail in a flat swatch to lose.
5. Move that collapsed point onto the target swatch with **G** (grab). For precision, press **N**
   in the UV Editor to open its side panel, **Item** tab, and type exact **Vertex X / Y**
   coordinates: each 8x8 swatch occupies 1/8 (0.125) of UV space per axis, so swatch column `c`,
   row `r` (both 0 to 7) has its centre at `((c + 0.5) / 8, (r + 0.5) / 8)`. Typing the number is
   more reliable than eyeballing it against the viewport grid.
6. Repeat per face group, per prop.

### Why this yields one material and very few draw calls

Every prop in the kit references the same material, the same 64x64 image, and differs only in
where its (collapsed, single-point) UVs sample that image. Nothing about a prop's material is
unique to that prop. That uniformity is exactly what lets a renderer batch multiple objects into
one draw call instead of issuing a separate one per material, which is the mechanism behind the
under-30-draw-calls budget in Section 4. Compare this to per-prop unique textures, which would
force a material (and usually a draw call) switch every time the renderer moved from one prop to
the next.

---

## 3. Prop conventions

**Origin at base centre.** For every prop, set the object's origin to the horizontal centre of
its footprint, at the point where it touches the floor. This is what lets a prop be placed in a
room by setting a single position value and have it sit correctly on the floor with no per-prop
offset math. To set this: move the 3D cursor to where you want the origin (**Shift+S** opens the
Snap pie menu; "Cursor to Selected" after selecting the base-centre geometry is the reliable
route), then **Object → Set Origin → Origin to 3D Cursor**.

**Apply transforms before export, and why a forgotten scale breaks things.** Every prop should
go into export with **Object → Apply → All Transforms** (or at minimum Scale) run on it, so its
object-level Location/Rotation/Scale in the N-panel read `0,0,0` / `0,0,0` / `1,1,1` and all the
actual shape lives in the mesh data itself. If you leave a non-applied scale on an object, say
you scaled a prop down by half in Object Mode and never applied it, the object's transform
carries that 0.5 multiplier invisibly. glTF export carries transforms through, so the prop will
still look right in isolation, but the moment code in `src/lib/house/scene.ts` or a future
kitbashing tool tries to reason about the prop's size using the mesh's own bounding box (which is
measured before the object-level scale is applied), the numbers will be wrong by exactly whatever
scale you forgot to apply. It also silently breaks the assumption that 1 unit in the mesh equals
1 world unit, a property this entire pipeline depends on. Apply transforms as a habitual last
step before export, every prop, every time.

**Naming.** Use these exact names so the kit reads consistently and any tooling that matches on
name works without special-casing:

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

**Model to the grid.** Build every prop's key dimensions as clean fractions or multiples of a
shared unit (whole units, halves, quarters, matching the 0.25 increment habit from Section 1).
A crate that's exactly 1x1x1, a chair seat height that's exactly 0.5, a door that's exactly 1
wide, snap together predictably when kitbashing a room. Props with odd, un-round dimensions
(0.83, 1.17) look fine alone and then visibly fail to align against everything else the moment
you try to combine them.

---

## 4. Budgets

| Item | Target |
|---|---:|
| Prop, each | 200 to 800 triangles |
| Character, including head | 2,000 to 4,000 triangles |
| Whole scene | under 100,000 triangles |
| Draw calls | under 30 |
| Scene assets, compressed | under 2.5 MB |

**The triangle numbers are generous on purpose. Draw calls and download size are the real
constraints,** and the palette atlas from Section 2 is what keeps both of them down: one shared
material means props batch instead of each forcing a separate draw call, and flat colours with
no texture maps to bake or ship keep every prop's exported footprint small.

**Checking triangle count inside Blender.** In the 3D viewport header, open the **Overlays**
dropdown (the two overlapping circles icon) and, under the **Guides** section, enable
**Statistics**. This prints a running count of vertices, edges, faces, triangles and objects in
the top-left corner of the viewport, updating live as you select objects: select a single prop
to see its individual tri count, or select everything (**A**) to see the scene total. There is
also a Scene Statistics option available in the Status Bar at the very bottom of the Blender
window (right-click the status bar for its own configuration menu), which shows similar
persistent counts without needing the Overlays panel open. I'm confident about the viewport
Overlays route; the exact right-click path to the status bar toggle I have lower confidence in
for 4.2 specifically, so if it's not where expected, F3, then "statistics", should find it.

**Checking draw calls.** Blender's viewport does not expose a real "draw calls" counter in the
sense that term is used for a runtime renderer like three.js. That is a property of how the
exported scene gets batched by the engine consuming it, not something Blender's own viewport
renderer reports, since Blender isn't the one drawing the final scene. The material and object
count inside Blender is a reasonable proxy while you work (fewer distinct materials generally
means fewer draw calls downstream), but to check the real number, load the exported `.glb` into
the actual three.js scene and read it there: three.js's `WebGLRenderer.info.render.calls`
reports the true draw call count for whatever was actually rendered that frame. Treat Blender's
material count as a budget you're managing toward, and the browser as the place you verify you
hit it.

**Scene assets, compressed, under 2.5 MB.** This covers the exported `.glb` files together
(prop kit, character, house shell) after Draco compression (Section 7), not the uncompressed
Blender project files. Check actual file size in your OS file browser after each export.

---

## 5. The character rig

Roughly fifteen bones, hand built. **Rigify is not used for this character, deliberately: it
exports to glTF messily.** Rigify's control rig and its generated deform rig carry a lot of
metadata, driver relationships and extra bones (control widgets, mechanism bones) that Blender's
glTF exporter does not cleanly reduce to a clean glTF skin. You end up either exporting far more
joints than the character needs, or fighting the exporter to strip Rigify's non-deforming bones
out correctly. A small hand-built skeleton with only the bones that actually deform the mesh
avoids that problem entirely and exports predictably.

**Bone names, exactly:**

```
root
hips
spine
chest
neck
head
shoulder_L, shoulder_R
arm_L, arm_R
forearm_L, forearm_R
thigh_L, thigh_R
shin_L, shin_R
foot_L, foot_R
```

That's 17 bones counting both sides of the six paired bones (shoulder, arm, forearm, thigh,
shin, foot: 12 bones) plus root, hips, spine, chest, neck, head (6 unpaired bones). Read
"roughly fifteen" as the spec's ballpark, not a hard count to hit exactly.

**Naming for symmetry.** Blender's X-axis mirror editing and the Symmetrize operator recognise a
set of left/right suffix conventions, and `_L` / `_R` (underscore, capital letter) is one of the
recognised pairs. This is what lets you build one side of the rig and mirror it rather than
placing every bone twice. Build the whole left side (`shoulder_L`, `arm_L`, and so on), then use
**Armature → Symmetrize** (in Edit Mode, with the armature selected) to generate the right side
automatically. I'm fairly confident `_L`/`_R` is recognised per Blender's documented armature
naming conventions, but if Symmetrize does not pick up your right-side bones automatically,
double check the exact case and underscore placement against what your Blender version expects
(F3, then "symmetrize" for the operator, or check the naming convention list in the Armature
data properties).

**Automatic weights.** With the mesh and the armature both selected in Object Mode, select the
mesh first, then **Shift-click** the armature last so the armature is the active object. Press
**Ctrl+P** to open the **Set Parent To** menu, and choose **Armature Deform → With Automatic
Weights**. Blender computes a starting vertex weight distribution per bone based on proximity
and bone envelope, which gets you a plausible-but-imperfect skin in one step rather than the
manual weight-painting-from-scratch workflow.

**The two places that always need hand correction: shoulders and hips.** Automatic weights
reliably gets limbs, the spine chain and the head roughly right, but shoulders and hips sit at
geometry junctions where several bones' influence overlaps (the shoulder blends chest, shoulder
and arm; the hip blends hips, spine and both thighs), and automatic weighting reliably guesses
wrong there. Expect visible pinching or tearing at the armpit and the hip crease as soon as you
pose the rig. Enter **Weight Paint** mode (mode dropdown, top-left of the 3D viewport header) on
the mesh with the armature in Pose Mode alongside it, select the offending bone in the bone
list, and manually paint the weight distribution at the shoulder and hip joints until posing
those areas deforms cleanly. Budget real time for this specifically; it is the one step
automatic weights does not solve for you.

---

## 6. Animations

Four clips: **idle, run, climb, lean**. **Idle is hand animated regardless of what else gets
sourced elsewhere**, because a bespoke idle sells a character far more than a bespoke run does,
and it's the one clip a visitor sees the moment a room's kid is on screen doing nothing else.

The frame ranges below assume Blender's default project frame rate of **24 fps** (Output
Properties tab, Format panel, Frame Rate field). They are starting points to animate against, not
numbers pulled from any existing animation data. Nothing in the codebase currently defines timing
for these clips, so treat these as recommended targets to tune by eye once the rig is moving, not
as verified constants the way the grid dimensions are.

- **Idle:** frames 1 to 48 (2 seconds). Loop point: frame 48 matches frame 1's pose exactly so
  the cycle has no visible pop on repeat. Keep it subtle: weight shift, a breath, maybe a glance,
  since this plays continuously whenever a room's character is idle on screen.
- **Run:** frames 1 to 24 (1 second per cycle, a brisk run at 24 fps). Loop point: frame 24
  matches frame 1. Standard run-cycle structure applies from your Maya experience: contact,
  down, passing, up, then repeat on the opposite leg at the halfway point (frame 13).
- **Climb:** frames 1 to 32. Pace this to one climb cycle per ladder rung rather than to a fixed
  loop time, since the character's traversal speed on the ladder (`CLIMB_SPEED` in
  `src/lib/house/character.ts`, currently 5 world units per second, slower than the walk speed
  of 9 on purpose, "it should read as effort") drives how many cycles play per floor climbed.
  Loop point: frame 32 matches frame 1.
- **Lean:** frames 1 to 16, a short one-shot rather than a loop, holding the final pose (the
  character leaning into a doorway as the camera pushes in). Do not loop this one; it plays once
  per room entry and holds.

**Evaluate Mixamo for the run cycle only**, not for idle, climb or lean. Mixamo auto-rigs and
retargets motion capture onto a standard humanoid skeleton reasonably well for a normally
proportioned adult rig, but this character is a stylised child with non-adult proportions: a
larger head-to-body ratio and shorter limbs than the reference skeletons Mixamo retargets from.
Motion built for adult proportions can read as wrong on a child rig even when the retarget
technically works: foot sliding, arms swinging through too wide an arc for the shorter limb
length, timing that looks too measured for a child's gait. Treat a Mixamo run as a fast first
pass to judge against, not a guaranteed final asset. If it looks off on the actual rig,
hand-animate the run too rather than shipping a retarget that reads wrong. This evaluation
happens in Phase 1 per the design spec; it is an open question there, not a decision made yet.

---

## 7. Export settings

**File → Export → glTF 2.0 (.glb/.gltf)**, format **glTF Binary (.glb)** in every case: one
file, textures and geometry embedded, nothing to lose track of on disk.

Three separate files, three slightly different settings:

| File | Contains | Animation exported? |
|---|---|---|
| Prop kit `.glb` | All ten `prop_*` meshes, one shared material | No |
| Character `.glb` | The rig, the skinned mesh, all four clips | Yes |
| House shell `.glb` | The room structure only (floors, back walls) | No |

**Checkboxes that matter, across all three files except where noted:**

- **Include** panel:
  - **Selected Objects:** off, unless you deliberately want to export a subset. Leaving it off
    exports everything visible per the other Include filters, which is normally what you want
    for a clean per-file export.
  - **Custom Properties:** on, in case any tooling later reads metadata off objects.
- **Transform** panel:
  - **+Y Up:** on, always. This is the checkbox that performs the Z-up (Blender) to Y-up
    (glTF/three.js) conversion described in Section 1. Do not also manually rotate your source
    geometry to compensate; that double-corrects and exports it upside down or sideways.
- **Geometry** panel:
  - **Apply Modifiers:** on. Bakes any modifier stack (bevels, mirrors, subdivision) into the
    exported mesh, which is what you want since the destination has no modifier stack to
    evaluate at runtime.
  - **UVs:** on.
  - **Normals:** on.
  - **Tangents:** off. Nothing in this kit needs normal mapping, which is the only thing
    tangents are for, so exporting them adds size for no benefit.
  - **Materials:** set to export materials normally, not "No export" or placeholder-only. The
    exact label for this dropdown may read "Export" or similar depending on version; the intent
    is that materials go out with the mesh, which for this kit means the single shared palette
    material and its image.
- **Compression** panel: enable it, algorithm **Draco**, compression level **6** (the slider's
  range runs roughly 0 to 10; 6 is a solid middle ground between file size and encode/decode
  cost for a kit this small. Geometry this simple won't show visible Draco compression
  artefacting even at more aggressive settings, but 6 is a safe default rather than something to
  chase further without a reason).
- **Animation** panel: **Export Animations** on for the character file only. Leave it off for
  the prop kit and the house shell, since neither has anything to animate, and an empty
  animation track is wasted bytes against the 2.5 MB budget.

The exact panel names and grouping (Include, Transform, Geometry, Compression, Animation)
reflect Blender 4.2's glTF exporter layout. This exporter (`io_scene_gltf2`) has had its options
reorganised across major versions before. If a checkbox isn't where described, F3, then the
checkbox's name (for example "Apply Modifiers"), will jump you to it regardless of which panel
it's currently grouped under.

---

## 8. The three delivery paths

One Blender scene, rendered once, feeds three destinations plus the loading poster, which
reuses one of the three (see below). This section covers the Blender-side render setup for each;
the code that decides which path a given visitor sees lives outside Blender's scope.

**Render engine: Eevee.** Open the **Render Properties** tab and set **Render Engine** to
**EEVEE** (in Blender 4.2 this may show as "EEVEE Next," reflecting a rewrite of the real-time
engine that landed in 4.2; check the dropdown for whichever label your installed version uses.
Either way it is Blender's real-time rasterised engine, not Cycles, and it's what the design
spec calls for since it's fast enough to iterate lighting on a game-style kit like this one).
Cycles is not used for any of these three deliveries. It would produce a cleaner render at a
render-time cost this project doesn't need to pay, since the kit's flat-colour palette approach
doesn't benefit much from path-traced lighting fidelity in the first place.

1. **Live three.js scene.** Blender's role here stops at the exported `.glb` files from
   Section 7. There is no Blender-side render for this path, since three.js renders the scene
   live in the visitor's browser using the exported geometry, materials and (for the character)
   animation directly.

2. **The pre-rendered still, for machines with WebGL blocked.** Frame the house exactly the way
   the default three.js camera would (whole-house overview, matching the framing math in
   `src/lib/house/camera.ts`'s `frameHouse`). In **Output Properties**, set resolution to
   **1920 x 1080** (a safe, common desktop viewport size; scale down responsively in CSS rather
   than rendering multiple fixed sizes) and export format to **PNG**. Render with **Render →
   Render Image**, then **Image → Save As**.

3. **The phone image sequence.** Same scene, reframed for the phone's 1x6 tower layout instead
   of the 3x2 desktop grid (matching `columnsFor`'s phone branch in `grid.ts`, which reflows
   below 768px viewport width). Render one still per room-to-room transition state you want to
   present as a fallback, at a portrait resolution: **1080 x 1920** is a reasonable phone-first
   target. Use **Output Properties → Output** to set a file path with a frame number placeholder
   (Blender's default `####` numbering pattern) and render as an **Image Sequence** via
   **Render → Render Animation**, having set the Frame Start/End in the Output Properties' Frame
   Range fields to bound exactly the frames you want, one per intended still.

4. **The OG image.** The site already generates `public/og.png` at **1200 x 630** via
   `scripts/generate-og.mjs` (currently an SVG composition, not a Blender render). Render a house
   shot at this same 1200x630 aspect ratio, or render larger (for example 2400 x 1260, exactly
   double, for a retina-safe source) and let downstream compositing crop and scale it into the
   existing OG template. Wiring this render into `generate-og.mjs` itself is application work
   outside this document's scope; this section's job is only to produce a Blender render at the
   right aspect ratio for that pipeline to consume.

**The loading poster is the pre-rendered still from item 2, reused.** It is shown immediately on
page load, before the live three.js scene has finished downloading, and the live scene swaps in
once ready, so nothing meaningful about the first paint waits on the multi-hundred-kilobyte
three.js chunk (see `houseJavascript` in `src/data/budget.ts`, budgeted at 220 KB gzipped). This
is why the pre-rendered still and the loading poster are the same asset rather than two separate
renders: whatever quality bar the still needs to hit as a WebGL-blocked fallback, it also needs
to hit as the very first thing every visitor sees.

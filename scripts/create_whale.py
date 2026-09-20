"""Original archipelago whale. Run with Blender --background --factory-startup --python this_file.

Creates a separate scene, preserves all pre-existing scenes, and exports selected asset nodes only.
Authoring helpers use glTF coordinates (Y up, nose +Z); Blender conversion happens at the mesh edge.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector, Euler

BASE = Path(__file__).resolve().parents[1]
OUTPUT = BASE / 'public' / 'assets' / 'whale.glb'
SOURCE = BASE / 'assets' / 'source' / 'whale.blend'
PREVIEW = BASE / 'output' / 'playwright' / 'whale-isometric.png'
for directory in [OUTPUT.parent, SOURCE.parent, PREVIEW.parent]:
    directory.mkdir(parents=True, exist_ok=True)

scene = bpy.data.scenes.new('Archipelago — the courteous whale')
if bpy.context.window:
    bpy.context.window.scene = scene
collection = bpy.data.collections.new('Archipelago Whale')
scene.collection.children.link(collection)
root = bpy.data.objects.new('CourteousWhale', None)
collection.objects.link(root)


def xyz(point):
    return Vector((point[0], -point[2], point[1]))


def material(name, color, roughness=0.72):
    mat = bpy.data.materials.new('Whale — ' + name)
    mat.use_nodes = True
    shader = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    mat.diffuse_color = (*color, 1)
    return mat


slate = material('blue-grey back', (0.125, 0.29, 0.35))
blue = material('sunlit facets', (0.18, 0.37, 0.40))
teal = material('soft flank', (0.15, 0.32, 0.35))
dark = material('deep teal fins', (0.085, 0.23, 0.28))
belly = material('warm ivory underside', (0.79, 0.84, 0.75))
pleat = material('throat pleats', (0.48, 0.64, 0.60))
eye = material('obsidian eyes', (0.015, 0.036, 0.039), 0.25)
white = material('eye glints', (0.95, 0.91, 0.72), 0.35)
BODY_MATERIALS = [slate, blue, teal, dark, belly]


def mesh(name, vertices, faces, materials, parent=root, origin=(0, 0, 0), indices=None):
    data = bpy.data.meshes.new(name)
    offset = xyz(origin)
    data.from_pydata([tuple(xyz(point) - offset) for point in vertices], [], faces)
    data.validate(verbose=False)
    data.update()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.parent = parent
    obj.location = offset - parent.location if parent != root else offset
    for mat in materials:
        data.materials.append(mat)
    for index, polygon in enumerate(data.polygons):
        polygon.use_smooth = False
        if indices:
            polygon.material_index = indices[index % len(indices)]
    return obj


def pivot(name, origin):
    obj = bpy.data.objects.new(name, None)
    collection.objects.link(obj)
    obj.parent = root
    obj.location = xyz(origin)
    return obj


def hull(name, rings, parent=root, origin=(0, 0, 0), sides=24):
    vertices, faces, materials = [], [], []
    for z, width, height, center in rings:
        for side in range(sides):
            angle = side * math.tau / sides
            vertices.append((width * math.cos(angle), center + height * math.sin(angle), z))
    for ring in range(len(rings) - 1):
        for side in range(sides):
            a = ring * sides + side
            b = ring * sides + (side + 1) % sides
            faces.append((a, b, b + sides, a + sides))
            sin_angle = math.sin((side + 0.5) * math.tau / sides)
            if sin_angle < -0.28 and rings[ring][0] > -1.2:
                materials.append(4)
            elif sin_angle > 0.45:
                materials.append(1 if (ring + side) % 6 == 0 else 0)
            elif sin_angle > -0.1:
                materials.append(2)
            else:
                materials.append(3)
    faces.append(tuple(reversed(range(sides))))
    materials.append(3)
    faces.append(tuple((len(rings) - 1) * sides + side for side in range(sides)))
    materials.append(2)
    return mesh(name, vertices, faces, BODY_MATERIALS, parent, origin, materials)


BODY_RINGS = [
    (-1.82, 0.29, 0.22, 0.03), (-1.48, 0.43, 0.34, 0.06),
    (-1.00, 0.67, 0.49, 0.09), (-0.40, 0.90, 0.64, 0.10),
    (0.25, 1.08, 0.73, 0.10), (0.95, 1.15, 0.74, 0.07),
    (1.55, 1.12, 0.66, 0.03), (2.08, 0.98, 0.51, -0.015),
    (2.48, 0.72, 0.35, -0.055), (2.76, 0.37, 0.17, -0.065),
    (2.88, 0.055, 0.055, -0.065),
]
hull('Broad rounded whale body', BODY_RINGS)


def plate(name, outline, thickness, mats, parent=root, origin=(0, 0, 0)):
    vertices = [(x, y + thickness / 2, z) for x, y, z in outline]
    vertices += [(x, y - thickness / 2, z) for x, y, z in outline]
    n = len(outline)
    # A center fan yields deliberate small planes, without expensive modifiers or textures.
    center = tuple(sum(point[axis] for point in outline) / n for axis in range(3))
    vertices.extend([(center[0], center[1] + thickness * 0.95, center[2]),
                     (center[0], center[1] - thickness * 0.65, center[2])])
    faces, indices = [], []
    for i in range(n):
        j = (i + 1) % n
        faces.extend([(2 * n, i, j), (2 * n + 1, n + j, n + i), (i, n + i, n + j, j)])
        indices.extend([0 if i % 3 else min(1, len(mats) - 1), len(mats) - 1, 0])
    return mesh(name, vertices, faces, mats, parent, origin, indices)


tail_origin = (0, 0.025, -1.7)
tail = pivot('TailPivot', tail_origin)
hull('Flexible tail stock', [(-2.8, 0.15, 0.085, 0), (-2.48, 0.19, 0.12, 0.01),
                            (-2.12, 0.23, 0.16, 0.02), (-1.65, 0.34, 0.26, 0.035)], tail, tail_origin, 16)
plate('Horizontal split tail flukes', [
    (0.0, 0.005, -2.48), (0.38, 0.0, -2.59), (0.93, 0.045, -2.56),
    (1.49, 0.13, -2.70), (1.32, 0.13, -2.98), (0.92, 0.07, -3.28),
    (0.46, 0.02, -3.24), (0, -0.005, -2.91), (-0.46, 0.02, -3.24),
    (-0.92, 0.07, -3.28), (-1.32, 0.13, -2.98), (-1.49, 0.13, -2.70),
    (-0.93, 0.045, -2.56), (-0.38, 0.0, -2.59),
], 0.07, [slate, blue, belly], tail, tail_origin)

flippers = []
for sign, name in [(-1, 'FlipperLeft'), (1, 'FlipperRight')]:
    origin = (sign * 0.88, -0.22, 1.03)
    hinge = pivot(name, origin)
    outline = [
        (sign * 0.83, -0.17, 1.25), (sign * 1.15, -0.25, 1.01),
        (sign * 1.66, -0.26, 0.45), (sign * 2.05, -0.18, -0.13),
        (sign * 2.22, -0.13, -0.43), (sign * 2.12, -0.16, -0.64),
        (sign * 1.91, -0.25, -0.57), (sign * 1.50, -0.36, -0.03),
        (sign * 1.05, -0.40, 0.49), (sign * 0.75, -0.29, 0.79),
    ]
    if sign == 1:
        outline.reverse()
    plate(name + ' paddle', outline, 0.075, [teal, blue, belly], hinge, origin)
    flippers.append(hinge)

# A small swept humpback dorsal fin, never a shark's dominating triangular sail.
mesh('Small curved dorsal fin', [
    (-0.10, 0.52, -0.51), (0.10, 0.52, -0.51), (-0.035, 0.98, -0.91),
    (0.035, 0.98, -0.91), (-0.025, 0.97, -1.17), (0.025, 0.97, -1.17),
    (-0.08, 0.44, -1.16), (0.08, 0.44, -1.16),
], [(0, 2, 4, 6), (1, 7, 5, 3), (0, 1, 3, 2), (2, 3, 5, 4), (4, 5, 7, 6), (0, 6, 7, 1)], [slate, blue], indices=[0, 1, 1, 0, 0, 0])


def ellipsoid(name, center, radii, mat, segments=12, rings=6):
    vertices, faces = [], []
    for row in range(rings + 1):
        phi = math.pi * row / rings
        for side in range(segments):
            theta = side * math.tau / segments
            vertices.append((center[0] + radii[0] * math.sin(phi) * math.cos(theta),
                             center[1] + radii[1] * math.sin(phi) * math.sin(theta),
                             center[2] + radii[2] * math.cos(phi)))
    for row in range(rings):
        for side in range(segments):
            a, b = row * segments + side, row * segments + (side + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    return mesh(name, vertices, faces, [mat])


def tube(name, points, thickness, mat, sides=6):
    vertices, faces = [], []
    for i, point in enumerate(points):
        tangent = Vector(points[min(i + 1, len(points) - 1)]) - Vector(points[max(i - 1, 0)])
        tangent.normalize()
        across = tangent.cross(Vector((0, 1, 0)))
        if across.length < 0.01:
            across = tangent.cross(Vector((1, 0, 0)))
        across.normalize()
        other = tangent.cross(across).normalized()
        for side in range(sides):
            angle = side * math.tau / sides
            vertices.append(tuple(Vector(point) + thickness * (math.cos(angle) * across + math.sin(angle) * other)))
    for row in range(len(points) - 1):
        for side in range(sides):
            a, b = row * sides + side, row * sides + (side + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    return mesh(name, vertices, faces, [mat])


for sign, side in [(-1, 'left'), (1, 'right')]:
    ellipsoid('Ivory eye surround ' + side, (sign * 0.995, -0.075, 1.96), (0.075, 0.098, 0.105), belly)
    ellipsoid('Gentle dark eye ' + side, (sign * 1.042, -0.068, 1.96), (0.041, 0.064, 0.070), eye)
    ellipsoid('Tiny eye glint ' + side, (sign * 1.073, -0.037, 1.978), (0.014, 0.019, 0.020), white, 8, 4)
    tube('Curved mouth ' + side, [(0, -0.09, 2.885), (sign * 0.33, -0.19, 2.69),
                                (sign * 0.60, -0.28, 2.48), (sign * 0.78, -0.35, 2.16),
                                (sign * 0.91, -0.38, 1.77), (sign * 0.96, -0.34, 1.40)], 0.022, dark)


def body_section(z):
    for index in range(len(BODY_RINGS) - 1):
        a, b = BODY_RINGS[index:index + 2]
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            return [a[j] * (1 - t) + b[j] * t for j in range(1, 4)]
    return BODY_RINGS[-1][1:]


for index, ratio in enumerate([-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72]):
    points = []
    for step in range(18):
        t = step / 17
        z = 2.57 - 3.01 * t
        width, height, center = body_section(z)
        x = ratio * width * (0.55 + 0.35 * math.sin(t * math.pi))
        y = center - height * math.sqrt(max(0, 1 - (x / width) ** 2)) - 0.012
        points.append((x, y, z))
    tube('Throat pleat %02d' % index, points, 0.012, pleat, 5)

# Subtle paired blowholes and forehead tubercles make the broad head read as a whale at a glance.
for sign in [-1, 1]:
    ellipsoid('Blowhole %s' % sign, (sign * 0.092, 0.645, 1.48), (0.057, 0.014, 0.105), dark, 10, 4)
for index, (x, z, size) in enumerate([(-0.42, 2.28, 0.061), (0.0, 2.53, 0.053), (0.42, 2.28, 0.061), (-0.62, 2.02, 0.048), (0.62, 2.02, 0.048)]):
    width, height, center = body_section(z)
    y = center + height * math.sqrt(max(0, 1 - (x / width) ** 2))
    ellipsoid('Head tubercle %02d' % index, (x, y, z), (size, size * 0.48, size * 1.2), blue, 8, 4)

scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 97
for node in [tail, *flippers]:
    for frame in range(1, 98, 4):
        phase = (frame - 1) / 96 * math.tau
        if node == tail:
            node.rotation_euler = Euler((math.radians(10) * math.sin(phase), 0, 0))
        else:
            sign = -1 if node == flippers[0] else 1
            # Blender Y is the longitudinal axis; this raises and lowers the broad side paddles.
            node.rotation_euler = Euler((0, sign * math.radians(7) * math.sin(phase + 0.6), 0))
        node.keyframe_insert(data_path='rotation_euler', frame=frame, group='GentleSwim')
    action = node.animation_data.action
    action.name = node.name + ' — gentle swim'
    track = node.animation_data.nla_tracks.new()
    track.name = 'GentleSwim'
    track.strips.new('GentleSwim', 1, action)
    node.animation_data.action = None
scene.frame_set(1)

# A presentation scene stays in the .blend but is excluded from the runtime export.
world = bpy.data.worlds.new('Whale studio sea')
world.use_nodes = True
background = next(node for node in world.node_tree.nodes if node.type == 'BACKGROUND')
background.inputs['Color'].default_value = (0.20, 0.29, 0.31, 1)
background.inputs['Strength'].default_value = 0.7
scene.world = world
camera_data = bpy.data.cameras.new('Whale portrait camera')
camera = bpy.data.objects.new('Whale portrait camera', camera_data)
scene.collection.objects.link(camera)
camera_types = [item.identifier for item in camera_data.bl_rna.properties['type'].enum_items]
camera_data.type = next(item for item in camera_types if item == 'ORTHO')
camera_data.ortho_scale = 9.2
camera.location = xyz((7.2, 6.8, 8.6))
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = camera
for name, location, power, size in [('Key', (3, 7, 4), 850, 6), ('Fill', (-4, 4, -1), 600, 5), ('Rim', (1, 3, -6), 750, 4)]:
    light_types = [item.identifier for item in bpy.types.Light.bl_rna.properties['type'].enum_items]
    light_data = bpy.data.lights.new('Whale ' + name, next(item for item in light_types if item == 'AREA'))
    light_data.energy = power
    light_data.shape = next(item.identifier for item in light_data.bl_rna.properties['shape'].enum_items if item.identifier == 'DISK')
    light_data.size = size
    light = bpy.data.objects.new('Whale ' + name, light_data)
    scene.collection.objects.link(light)
    light.location = xyz(location)
    light.rotation_euler = (-light.location).to_track_quat('-Z', 'Y').to_euler()

scene.render.resolution_x = 900
scene.render.resolution_y = 675
scene.render.resolution_percentage = 100
scene.render.film_transparent = False
file_formats = [item.identifier for item in scene.render.image_settings.bl_rna.properties['file_format'].enum_items]
scene.render.image_settings.file_format = next(item for item in file_formats if item == 'PNG')
scene.render.filepath = str(PREVIEW)

for obj in bpy.context.selected_objects:
    obj.select_set(False)
for obj in collection.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root

gltf_operator = bpy.types.Operator.bl_rna_get_subclass_py('EXPORT_SCENE_OT_gltf')
export_base = next(cls for cls in gltf_operator.__mro__ if cls.__name__ == 'ExportGLTF2_Base')
formats = export_base.__annotations__['export_format'].keywords['items'](None, bpy.context)
glb_format = next(item[0] for item in formats if item[0] == 'GLB')
props = bpy.ops.export_scene.gltf.get_rna_type().properties
export_args = dict(filepath=str(OUTPUT), export_format=glb_format, use_selection=True, export_animations=True)
if 'use_active_scene' in props:
    export_args['use_active_scene'] = True
if 'export_animation_mode' in props:
    modes = [item.identifier for item in props['export_animation_mode'].enum_items]
    if 'NLA_TRACKS' in modes:
        export_args['export_animation_mode'] = next(item for item in modes if item == 'NLA_TRACKS')
if 'export_anim_slide_to_zero' in props:
    export_args['export_anim_slide_to_zero'] = True
bpy.ops.export_scene.gltf(**export_args)
if OUTPUT.stat().st_size > 700_000:
    raise RuntimeError('Whale export exceeds the browser asset budget.')

for obj in collection.objects:
    obj.select_set(False)
if bpy.context.screen:
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            area.spaces.active.region_3d.view_location = Vector((0, 0, 0))
            area.spaces.active.region_3d.view_distance = 10
            area.spaces.active.region_3d.view_rotation = camera.rotation_euler.to_quaternion()
            shading = area.spaces.active.shading
            color_types = [item.identifier for item in shading.bl_rna.properties['color_type'].enum_items]
            shading.color_type = next(item for item in color_types if item == 'MATERIAL')
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE))
print('WHALE_ASSET', json.dumps({'file': str(OUTPUT), 'bytes': OUTPUT.stat().st_size,
                               'scene': scene.name, 'objects': len(collection.objects),
                               'orientation': 'glTF +Z nose, +Y up', 'clip': 'GentleSwim', 'seconds': 4.0}), flush=True)
bpy.ops.render.render(write_still=True)
camera.location = xyz((0.001, 12, 0))
camera.rotation_euler = (-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(PREVIEW.with_name('whale-top.png'))
bpy.ops.render.render(write_still=True)

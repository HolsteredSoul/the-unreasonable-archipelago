import bpy, math
from mathutils import Vector
from pathlib import Path
base = Path(r"C:\DEV\Procedural")
(base / "public/assets").mkdir(parents=True, exist_ok=True)
(base / "assets/source").mkdir(parents=True, exist_ok=True)
scene = bpy.data.scenes.new("Archipelago — botanical bell")
bpy.context.window.scene = scene
collection = bpy.data.collections.new("Archipelago Bell")
scene.collection.children.link(collection)
root = bpy.data.objects.new("BellFlower", None)
collection.objects.link(root)
def material(name, color, metal=0.0, rough=0.65):
    m=bpy.data.materials.new(name); m.use_nodes=True
    shader=next(n for n in m.node_tree.nodes if n.type=="BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value=(*color,1)
    shader.inputs["Metallic"].default_value=metal
    shader.inputs["Roughness"].default_value=rough
    m.diffuse_color=(*color,1)
    return m
coral=material("Petal — warm coral",(0.83,0.26,0.23))
pink=material("Petal — rose silk",(0.98,0.51,0.40))
cream=material("Petal — pale interior",(1.0,0.73,0.48))
brass=material("Bell — brushed brass",(0.75,0.48,0.14),0.65,0.34)
green=material("Stem — sage enamel",(0.22,0.38,0.18),0.15,0.54)
leafmat=material("Leaves — sea green",(0.27,0.48,0.31))
def mesh(name, verts, faces, mat):
    d=bpy.data.meshes.new(name); d.from_pydata(verts,[],faces); d.validate(verbose=False); d.update()
    o=bpy.data.objects.new(name,d); collection.objects.link(o); o.parent=root
    o.data.materials.append(mat)
    for p in d.polygons: p.use_smooth=True
    return o
def tube(name, points, radius, mat, sides=10):
    verts=[]; faces=[]
    for i,p in enumerate(points):
        v=Vector(p)
        tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        tangent.normalize()
        cross=tangent.cross(Vector((0,1,0)))
        if cross.length<0.01: cross=tangent.cross(Vector((1,0,0)))
        cross.normalize(); other=tangent.cross(cross).normalized()
        rad=radius if isinstance(radius,(float,int)) else radius[i]
        for k in range(sides):
            a=2*math.pi*k/sides
            verts.append(tuple(v+rad*(math.cos(a)*cross+math.sin(a)*other)))
    for i in range(len(points)-1):
        for k in range(sides):
            a=i*sides+k; b=i*sides+(k+1)%sides
            faces.append((a,b,b+sides,a+sides))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple((len(points)-1)*sides+k for k in range(sides)))
    return mesh(name,verts,faces,mat)
def bezier(a,b,c,d,count=30):
    return [tuple((1-t)**3*Vector(a)+3*(1-t)**2*t*Vector(b)+3*(1-t)*t*t*Vector(c)+t**3*Vector(d)) for t in [i/(count-1) for i in range(count)]]
stem=bezier((0.65,0,0),(0.88,0,1.25),(0.5,0,3.05),(-0.35,0,2.95))
stem += bezier((-0.35,0,2.95),(-0.72,0,2.97),(-0.60,0,2.61),(-0.55,0,2.50))[1:]
tube("Arching living stem",stem,[0.095-0.045*i/(len(stem)-1) for i in range(len(stem))],green)
for j in range(5):
    a=j*2*math.pi/5
    pts=bezier((0.65,0,0.20),(0.65+math.cos(a)*0.24,math.sin(a)*0.24,0.1),(0.65+math.cos(a)*0.44,math.sin(a)*0.44,0.04),(0.65+math.cos(a)*0.6,math.sin(a)*0.6,0.02),14)
    tube("Root %02d"%j,pts,[0.06*(1-i/16) for i in range(14)],green,8)
print("Created separate asset scene and arching stem; existing scene preserved.")

center=(-0.55,0,2.5)
for j in range(6):
    verts=[]; faces=[]; rows=18; cols=10
    for side in range(2):
        for i in range(rows+1):
            t=i/rows
            radius=0.16+0.50*t*t+0.07*math.sin(t*math.pi)
            z=2.48-0.95*t+0.16*t**7
            for k in range(cols+1):
                u=k/cols
                angle=j*math.tau/6+(u-0.5)*0.96
                r=radius+0.055*math.sin(u*math.pi)*math.sin(t*math.pi)
                zz=z+0.085*(abs(u-0.5)*2)**2*t+side*0.025
                verts.append((center[0]+r*math.cos(angle),r*math.sin(angle),zz))
    count=(rows+1)*(cols+1)
    for side in range(2):
        for i in range(rows):
            for k in range(cols):
                a=side*count+i*(cols+1)+k
                quad=(a,a+1,a+cols+2,a+cols+1)
                faces.append(quad if side==0 else tuple(reversed(quad)))
    mesh("Flower petal %02d"%j,verts,faces,pink if j%2 else coral)
    vein=[]
    for i in range(23):
        t=i/22
        r=0.165+0.50*t*t+0.125*math.sin(t*math.pi)
        vein.append((center[0]+r*math.cos(j*math.tau/6),r*math.sin(j*math.tau/6),2.51-0.95*t+0.16*t**7))
    tube("Golden petal vein %02d"%j,vein,0.012,brass,6)
for z,radius in [(2.5,0.19),(2.39,0.23)]:
    pts=[(center[0]+radius*math.cos(i*math.tau/48),radius*math.sin(i*math.tau/48),z) for i in range(49)]
    tube("Crown collar",pts,0.04,brass,8)
tube("Bell stamen",[(center[0],0,2.48),(center[0],0,1.34)],0.026,brass,8)
def ellipsoid(name,center,radii,mat,segments=16,rings=10):
    verts=[]; faces=[]
    for j in range(rings+1):
        p=math.pi*j/rings
        for k in range(segments):
            a=math.tau*k/segments
            verts.append((center[0]+radii[0]*math.sin(p)*math.cos(a),center[1]+radii[1]*math.sin(p)*math.sin(a),center[2]+radii[2]*math.cos(p)))
    for j in range(rings):
        for k in range(segments):
            a=j*segments+k;b=j*segments+(k+1)%segments
            faces.append((a,b,b+segments,a+segments))
    return mesh(name,verts,faces,mat)
ellipsoid("Golden clapper",(-0.55,0,1.29),(0.085,0.085,0.12),brass)
for n,(z,angle) in enumerate([(0.55,-0.5),(1.05,2.6),(1.7,0.15)]):
    ox=0.71 if n<2 else 0.49
    direction=Vector((math.cos(angle),math.sin(angle),0.46))
    across=Vector((-math.sin(angle),math.cos(angle),0))
    basep=Vector((ox,0,z))
    verts=[];faces=[]
    for i in range(13):
        t=i/12
        for k in [-1,0,1]:
            v=basep+direction*(0.76*t)+across*(k*math.sin(math.pi*t)*0.18)
            v.z+=math.sin(math.pi*t)*(0.08 if k==0 else -0.03)
            verts.append(tuple(v))
    for i in range(12):
        for k in range(2):
            a=i*3+k;faces.append((a,a+1,a+4,a+3));faces.append((a+3,a+4,a+1,a))
    mesh("Stem leaf %02d"%n,verts,faces,leafmat)
    tube("Leaf midrib %02d"%n,[tuple(basep+direction*(0.76*t)+Vector((0,0,math.sin(math.pi*t)*0.085))) for t in [i/12 for i in range(13)]],0.014,green,6)
for o in bpy.context.selected_objects: o.select_set(False)
for o in collection.objects:
    if o.type=="MESH": o.select_set(True)
bpy.context.view_layer.objects.active=next(o for o in collection.objects if o.type=="MESH")
from mathutils import Euler
for area in bpy.context.screen.areas:
    if area.type=="VIEW_3D":
        area.spaces.active.region_3d.view_location=Vector((-0.05,0,1.45))
        area.spaces.active.region_3d.view_distance=6.4
        area.spaces.active.region_3d.view_rotation=Euler((math.radians(76),0,math.radians(-18))).to_quaternion()
        shading=area.spaces.active.shading
        if "MATERIAL" in [x.identifier for x in shading.bl_rna.properties["color_type"].enum_items]:
            shading.color_type="MATERIAL"
print("Flower petals, brass veins, crown, clapper, and leaves created.")
import bpy, math
for obj in bpy.data.collections["Archipelago Bell"].objects:
    if obj.type=="MESH" and (obj.name.startswith("Flower petal") or obj.name.startswith("Golden petal vein")):
        if obj.data.shape_keys is None:
            obj.shape_key_add(name="Basis")
            closed=obj.shape_key_add(name="Closed")
            for vertex in closed.data:
                t=max(0.0,min(1.0,(2.50-vertex.co.z)/1.0))
                scale=0.25+0.40*math.sin(math.pi*t)
                vertex.co.x=-0.55+(vertex.co.x+0.55)*scale
                vertex.co.y*=scale
            closed.value=0.0
print("Added closed-bud morph targets.")

import bpy, os
from pathlib import Path
base=Path(r"C:\DEV\Procedural")
cls=bpy.types.Operator.bl_rna_get_subclass_py("EXPORT_SCENE_OT_gltf")
export_base=next(c for c in cls.__mro__ if c.__name__=="ExportGLTF2_Base")
formats=export_base.__annotations__["export_format"].keywords["items"](None,bpy.context)
glb_format=next(item[0] for item in formats if item[0]=="GLB")
for o in bpy.context.selected_objects: o.select_set(False)
for o in bpy.data.collections["Archipelago Bell"].objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(base/"public/assets/bell-flower.glb"),export_format=glb_format,use_selection=True,export_animations=False)
for o in bpy.context.selected_objects: o.select_set(False)
bpy.ops.wm.save_as_mainfile(filepath=str(base/"assets/source/bell-flower.blend"))
print("GLB bytes",os.path.getsize(base/"public/assets/bell-flower.glb"))


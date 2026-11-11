import re
import json
import os

step_path = os.path.abspath('website/3d/Olitec_Battery.step')
out_obj_path = os.path.abspath('website/public/models/olitec-battery.obj')
out_mtl_path = os.path.abspath('website/public/models/olitec-battery.mtl')
out_json_path = os.path.abspath('website/public/models/olitec-battery.json')

with open(step_path, 'r', errors='ignore') as f:
    text = f.read()

entities = {}
for line in text.splitlines():
    line = line.strip()
    if line.startswith('#') and '=' in line:
        eid, rest = line[1:].split('=', 1)
        if rest.endswith(';'): rest = rest[:-1]
        entities[int(eid)] = rest

points = {}
for eid, val in entities.items():
    if val.startswith('CARTESIAN_POINT'):
        m = re.search(r',\(([^)]+)\)', val)
        if m: points[eid] = [float(x.strip()) for x in m.group(1).split(',')]

vertices = {}
for eid, val in entities.items():
    if val.startswith('VERTEX_POINT'):
        m = re.search(r'#(\d+)', val)
        if m: vertices[eid] = points[int(m.group(1))]

edge_curves = {}
for eid, val in entities.items():
    if val.startswith('EDGE_CURVE'):
        m = re.findall(r'#(\d+)', val)
        if len(m) >= 2: edge_curves[eid] = (int(m[0]), int(m[1]))

oriented_edges = {}
for eid, val in entities.items():
    if val.startswith('ORIENTED_EDGE'):
        parts = val.split(',')
        edge_id = int(re.search(r'#(\d+)', parts[3]).group(1))
        sense = '.T.' in parts[4]
        oriented_edges[eid] = (edge_id, sense)

edge_loops = {}
for eid, val in entities.items():
    if val.startswith('EDGE_LOOP'):
        edges = [int(x) for x in re.findall(r'#(\d+)', val)]
        edge_loops[eid] = edges

faces = {}
for eid, val in entities.items():
    if val.startswith('ADVANCED_FACE'):
        m = re.findall(r'#(\d+)', val)
        faces[eid] = int(m[0])

face_bounds = {}
for eid, val in entities.items():
    if val.startswith('FACE_OUTER_BOUND'):
        m = re.search(r'#(\d+)', val)
        face_bounds[eid] = int(m.group(1))

solids = {}
for eid, val in entities.items():
    if val.startswith('MANIFOLD_SOLID_BREP'):
        name = re.search(r'\'([^\']*)\'', val).group(1)
        cs_id = int(re.search(r'#(\d+)', val).group(1))
        solids[eid] = (name, cs_id)

styles = re.findall(r'#(\d+)=STYLED_ITEM\(\'([^\']*)\',\(([^)]+)\),#(\d+)\);', text)
solid_colors = {}
for _, _, style_val, target_id in styles:
    tid = int(target_id)
    cur = int(re.search(r'#(\d+)', style_val).group(1))
    while cur in entities:
        ent = entities[cur]
        if 'COLOUR_RGB' in ent:
            m = re.search(r'COLOUR_RGB\([^,]*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)', ent)
            if m:
                solid_colors[tid] = [float(m.group(1)), float(m.group(2)), float(m.group(3))]
            break
        m_next = re.search(r'#(\d+)', ent)
        if m_next: cur = int(m_next.group(1))
        else: break

# Generate Wavefront OBJ and MTL and JSON model
# Center model around origin and convert mm to scale ~1.0
all_x, all_y, all_z = [], [], []
for p in points.values():
    all_x.append(p[0])
    all_y.append(p[1])
    all_z.append(p[2])

cx = (min(all_x) + max(all_x)) / 2.0
cy = (min(all_y) + max(all_y)) / 2.0
cz = (min(all_z) + max(all_z)) / 2.0
max_dim = max(max(all_x)-min(all_x), max(all_y)-min(all_y), max(all_z)-min(all_z))
scale = 2.0 / max_dim

print(f"Center: ({cx}, {cy}, {cz}), Scale: {scale}")

# We will collect unique vertices and materials
materials = {}
json_parts = []
obj_lines = [f"mtllib olitec-battery.mtl"]
mtl_lines = []

global_verts = []
vert_map = {}

def get_vert_idx(pt):
    # transform mm coordinates: center & scale, Z up -> Y up for Three.js (x, z, -y)
    nx = round((pt[0] - cx) * scale, 5)
    ny = round((pt[2] - cz) * scale, 5) # Z is height in CAD
    nz = round(-(pt[1] - cy) * scale, 5) # Y is depth in CAD
    key = (nx, ny, nz)
    if key not in vert_map:
        vert_map[key] = len(global_verts) + 1
        global_verts.append(key)
        obj_lines.append(f"v {nx:.5f} {ny:.5f} {nz:.5f}")
    return vert_map[key], key

for sid, (name, cs_id) in solids.items():
    color = solid_colors.get(sid, [0.7, 0.7, 0.7])
    mat_name = f"mat_{name}"
    materials[mat_name] = color
    obj_lines.append(f"\no {name}")
    obj_lines.append(f"usemtl {mat_name}")
    
    cs_val = entities[cs_id]
    face_ids = [int(x) for x in re.findall(r'#(\d+)', cs_val)]
    
    part_triangles = []
    
    for fid in face_ids:
        b_id = faces[fid]
        loop_id = face_bounds[b_id]
        oe_ids = edge_loops[loop_id]
        
        poly_pts = []
        for oe_id in oe_ids:
            edge_id, sense = oriented_edges[oe_id]
            vstart, vend = edge_curves[edge_id]
            p = vertices[vstart] if sense else vertices[vend]
            poly_pts.append(p)
            
        if len(poly_pts) >= 3:
            indices = []
            keys = []
            for pt in poly_pts:
                idx, key = get_vert_idx(pt)
                indices.append(idx)
                keys.append(key)
                
            # Triangulate polygon as fan from vertex 0
            for i in range(1, len(indices) - 1):
                obj_lines.append(f"f {indices[0]} {indices[i]} {indices[i+1]}")
                part_triangles.append([keys[0], keys[i], keys[i+1]])

    json_parts.append({
        "name": name,
        "color": [round(c, 3) for c in color],
        "triangles": part_triangles
    })

# Write MTL
for mat_name, col in materials.items():
    mtl_lines.append(f"newmtl {mat_name}")
    mtl_lines.append(f"Kd {col[0]:.3f} {col[1]:.3f} {col[2]:.3f}")
    mtl_lines.append(f"Ka {col[0]*0.2:.3f} {col[1]*0.2:.3f} {col[2]*0.2:.3f}")
    mtl_lines.append("Ks 0.4 0.4 0.4")
    mtl_lines.append("Ns 30.0")
    mtl_lines.append("d 1.0\n")

with open(out_obj_path, 'w') as f:
    f.write("\n".join(obj_lines))

with open(out_mtl_path, 'w') as f:
    f.write("\n".join(mtl_lines))

with open(out_json_path, 'w') as f:
    json.dump({"name": "Olitec Battery", "parts": json_parts}, f)

print(f"Successfully generated:")
print(f"  {out_obj_path} ({os.path.getsize(out_obj_path)} bytes)")
print(f"  {out_mtl_path} ({os.path.getsize(out_mtl_path)} bytes)")
print(f"  {out_json_path} ({os.path.getsize(out_json_path)} bytes)")

-- ============================================
-- WebGIS 数据库初始化脚本
-- PostgreSQL + PostGIS
-- ============================================

-- 1. 启用 PostGIS 扩展
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. 创建建筑物表
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    building_type VARCHAR(50) NOT NULL CHECK (
        building_type IN ('teaching', 'dormitory', 'canteen', 'library', 'sports', 'admin', 'other')
    ),
    description TEXT,
    address VARCHAR(200),
    website VARCHAR(200),
    phone VARCHAR(20),
    location GEOMETRY(Point, 4326) NOT NULL,  -- 4326 = WGS84 坐标系
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建空间索引（加速地理查询）
CREATE INDEX buildings_location_idx ON buildings USING GIST (location);

-- 3. 创建路线表（用于路径规划）
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    route_type VARCHAR(20) CHECK (route_type IN ('walk', 'bike', 'bus')),
    path GEOMETRY(LineString, 4326) NOT NULL,
    distance_meters INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX routes_path_idx ON routes USING GIST (path);

-- 4. 创建区域/建筑群表
CREATE TABLE zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    boundary GEOMETRY(Polygon, 4326) NOT NULL,
    color VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX zones_boundary_idx ON zones USING GIST (boundary);

-- 5. 创建用户收藏/标注表
CREATE TABLE user_annotations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    title VARCHAR(200) NOT NULL,
    annotation_type VARCHAR(20) CHECK (annotation_type IN ('favorite', 'note', 'photo', 'review')),
    content TEXT,
    location GEOMETRY(Point, 4326) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 插入示例数据

-- 插入建筑物
INSERT INTO buildings (name, building_type, description, location) VALUES
('图书馆', 'library', '学校主图书馆，藏书丰富，有自习室', ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326)),
('第一教学楼', 'teaching', '主要为理工科教室', ST_SetSRID(ST_MakePoint(121.4745, 31.2310), 4326)),
('第二教学楼', 'teaching', '主要为文科教室', ST_SetSRID(ST_MakePoint(121.4720, 31.2295), 4326)),
('学生食堂', 'canteen', '有三层，提供多种餐饮', ST_SetSRID(ST_MakePoint(121.4730, 31.2300), 4326)),
('体育馆', 'sports', '有篮球场、游泳池、健身房', ST_SetSRID(ST_MakePoint(121.4750, 31.2280), 4326)),
('学生宿舍A区', 'dormitory', '本科生宿舍', ST_SetSRID(ST_MakePoint(121.4700, 31.2320), 4326)),
('行政楼', 'admin', '学校行政部门办公地点', ST_SetSRID(ST_MakePoint(121.4735, 31.2315), 4326));

-- 插入路线示例
INSERT INTO routes (name, route_type, path, distance_meters) VALUES
('图书馆-教学楼路线', 'walk', 
 ST_GeomFromText('LINESTRING(121.4737 31.2304, 121.4739 31.2305, 121.4745 31.2310)', 4326),
 150),

('食堂-宿舍路线', 'walk',
 ST_GeomFromText('LINESTRING(121.4730 31.2300, 121.4715 31.2310, 121.4700 31.2320)', 4326),
 300);

-- ============================================
-- 常用查询示例
-- ============================================

-- 查询1: 获取所有建筑物（返回 GeoJSON）
SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(features.feature)
) FROM (
    SELECT jsonb_build_object(
        'type', 'Feature',
        'id', id,
        'geometry', ST_AsGeoJSON(location)::jsonb,
        'properties', to_jsonb(row) - 'location' - 'id'
    ) AS feature
    FROM buildings row
) features;

-- 查询2: 附近搜索（找距离某点1000米内的建筑）
SELECT name, building_type, 
       ST_Distance(location, ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326)) as distance_meters
FROM buildings
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326),
    1000  -- 1000米
)
ORDER BY distance_meters;

-- 查询3: 按类型统计建筑数量
SELECT building_type, COUNT(*) as count
FROM buildings
GROUP BY building_type;

-- 查询4: 更新路线长度
UPDATE routes
SET distance_meters = ST_Length(path)  -- 自动计算长度（米）
WHERE distance_meters IS NULL;

-- ============================================
-- 视图：方便前端查询
-- ============================================

-- 建筑物视图（包含距离计算函数）
CREATE VIEW buildings_view AS
SELECT 
    b.*,
    ST_X(b.location) as longitude,
    ST_Y(b.location) as latitude
FROM buildings b;

-- GeoJSON 导出视图
CREATE VIEW buildings_geojson AS
SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', jsonb_agg(feature)
) as data FROM (
    SELECT jsonb_build_object(
        'type', 'Feature',
        'geometry', ST_AsGeoJSON(location)::jsonb,
        'properties', jsonb_build_object(
            'id', id,
            'name', name,
            'type', building_type,
            'description', description
        )
    ) as feature
    FROM buildings
) f;

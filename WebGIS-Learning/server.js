/**
 * WebGIS 后端 API 示例
 * Node.js + Express + PostgreSQL + PostGIS
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // 如果没有数据库URL，使用本地配置
    // host: 'localhost',
    // port: 5432,
    // database: 'webgis',
    // user: 'postgres',
    // password: 'your_password'
});

// ============================================
// API 路由
// ============================================

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'WebGIS API is running' });
});

/**
 * GET /api/buildings
 * 获取所有建筑物
 * 
 * Query 参数:
 * - type: 建筑物类型 (teaching, dormitory, canteen, library, sports, admin)
 * - limit: 返回数量限制
 */
app.get('/api/buildings', async (req, res) => {
    try {
        const { type, limit = 100 } = req.query;
        
        let query = `
            SELECT 
                id, name, building_type, description,
                ST_X(location) as longitude,
                ST_Y(location) as latitude
            FROM buildings
        `;
        
        const params = [];
        if (type) {
            query += ' WHERE building_type = $1';
            params.push(type);
        }
        
        query += ` ORDER BY name LIMIT $${params.length + 1}`;
        params.push(limit);
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/buildings/:id
 * 获取单个建筑物详情
 */
app.get('/api/buildings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT 
                id, name, building_type, description, address,
                ST_X(location) as longitude,
                ST_Y(location) as latitude
             FROM buildings WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Building not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/buildings/geojson
 * 获取建筑物 GeoJSON 格式（方便 Leaflet 直接加载）
 */
app.get('/api/buildings/geojson', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, name, building_type, description,
                ST_AsGeoJSON(location) as geometry
            FROM buildings
        `);
        
        const features = result.rows.map(row => ({
            type: 'Feature',
            properties: {
                id: row.id,
                name: row.name,
                type: row.building_type,
                description: row.description
            },
            geometry: JSON.parse(row.geometry)
        }));
        
        res.json({
            type: 'FeatureCollection',
            features: features
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/buildings/nearby
 * 附近搜索
 * 
 * Query 参数:
 * - lng: 经度 (必需)
 * - lat: 纬度 (必需)
 * - dist: 搜索半径，米 (默认 1000)
 */
app.get('/api/buildings/nearby', async (req, res) => {
    try {
        const { lng, lat, dist = 1000 } = req.query;
        
        if (!lng || !lat) {
            return res.status(400).json({ 
                success: false, 
                error: '请提供 lng (经度) 和 lat (纬度) 参数' 
            });
        }
        
        const result = await pool.query(`
            SELECT 
                id, name, building_type,
                ST_Distance(location, ST_SetSRID(ST_MakePoint($1, $2), 4326)) as distance_meters,
                ST_X(location) as longitude,
                ST_Y(location) as latitude
            FROM buildings
            WHERE ST_DWithin(
                location,
                ST_SetSRID(ST_MakePoint($1, $2), 4326),
                $3
            )
            ORDER BY distance_meters
        `, [lng, lat, dist]);
        
        res.json({
            success: true,
            center: { lng: parseFloat(lng), lat: parseFloat(lat) },
            radius_meters: parseInt(dist),
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/routes
 * 获取路线
 */
app.get('/api/routes', async (req, res) => {
    try {
        const { type } = req.query;
        
        let query = `
            SELECT 
                id, name, route_type, distance_meters,
                ST_AsGeoJSON(path) as geometry
            FROM routes
        `;
        
        if (type) {
            query += ' WHERE route_type = $1';
        }
        
        const result = await pool.query(query, type ? [type] : []);
        
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(row => ({
                ...row,
                geometry: JSON.parse(row.geometry)
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/buildings
 * 创建新建筑物
 */
app.post('/api/buildings', async (req, res) => {
    try {
        const { name, building_type, description, longitude, latitude } = req.body;
        
        if (!name || !building_type || !longitude || !latitude) {
            return res.status(400).json({
                success: false,
                error: '缺少必需字段: name, building_type, longitude, latitude'
            });
        }
        
        const result = await pool.query(`
            INSERT INTO buildings (name, building_type, description, location)
            VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326))
            RETURNING id, name, building_type, description,
                      ST_X(location) as longitude, ST_Y(location) as latitude
        `, [name, building_type, description || '', longitude, latitude]);
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/buildings/:id
 * 更新建筑物
 */
app.put('/api/buildings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, building_type, description } = req.body;
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (name) {
            updates.push(`name = $${paramCount++}`);
            values.push(name);
        }
        if (building_type) {
            updates.push(`building_type = $${paramCount++}`);
            values.push(building_type);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(description);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: '没有要更新的字段' });
        }
        
        values.push(id);
        
        const result = await pool.query(`
            UPDATE buildings SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, name, building_type, description
        `, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '建筑物不存在' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/buildings/:id
 * 删除建筑物
 */
app.delete('/api/buildings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM buildings WHERE id = $1 RETURNING id, name',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: '建筑物不存在' });
        }
        
        res.json({ success: true, message: `已删除: ${result.rows[0].name}` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║        🗺️ WebGIS API 服务器已启动            ║
╠═══════════════════════════════════════════════╣
║  端口: ${PORT}                                  
║  地址: http://localhost:${PORT}                  
╠═══════════════════════════════════════════════╣
║  API 端点:                                    ║
║  • GET  /api/health        健康检查           ║
║  • GET  /api/buildings     获取所有建筑       ║
║  • GET  /api/buildings/:id 获取单个建筑       ║
║  • GET  /api/buildings/geojson GeoJSON格式    ║
║  • GET  /api/buildings/nearby 附近搜索        ║
║  • POST /api/buildings      创建建筑           ║
║  • PUT  /api/buildings/:id  更新建筑           ║
║  • DELETE /api/buildings/:id 删除建筑         ║
║  • GET  /api/routes         获取路线           ║
╚═══════════════════════════════════════════════╝
    `);
});

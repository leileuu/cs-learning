# 🗺️ WebGIS 开发教程项目

> 从零开始学习 WebGIS 开发 | 整理时间：2026-04-01

---

## 📌 什么是 WebGIS？

WebGIS = **Web（网页）+ GIS（地理信息系统）**

让用户在浏览器里查看地图、叠加数据、做空间分析的技術。

**应用场景：**
- 🗺️ 百度/高德/Google 地图
- 🚚 物流追踪系统
- 🏠 房产信息平台
- 🌊 灾害预警地图
- 🚌 公交路线查询

---

## 🗺️ 技术栈概览

```
前端：HTML + CSS + JavaScript
        ↓
地图库：Leaflet / OpenLayers / Mapbox GL JS
        ↓
数据格式：GeoJSON, KML, Shapefile
        ↓
后端：Node.js / Python (FastAPI/Flask)
        ↓
数据库：PostgreSQL + PostGIS (空间数据库)
        ↓
服务器：Tile Server (地图瓦片服务)
```

---

## 📚 学习路线图

### 第一阶段：前端基础（Week 1-2）

| 任务 | 资源 | 状态 |
|------|------|------|
| HTML 基础 | MDN Web 文档 | ⬜ |
| CSS 布局 | Flexbox / Grid | ⬜ |
| JavaScript 基础 | DOM 操作、事件 | ⬜ |
| JSON 数据处理 | JSON.parse/stringify | ⬜ |

**练习项目：** 静态网页（个人介绍页）

---

### 第二阶段：地图库入门（Week 3-4）

#### 选择地图库

| 库 | 特点 | 难度 | 推荐场景 |
|----|------|------|---------|
| **Leaflet** | 轻量、简单、开源 | ⭐ | 初学者、快速原型 |
| OpenLayers | 功能强大、专业 | ⭐⭐⭐ | 企业级应用 |
| Mapbox GL JS | 炫酷、定制强 | ⭐⭐ | 酷炫可视化 |

**推荐从 Leaflet 开始！**

#### Leaflet 核心学习

```javascript
// 1. 引入 Leaflet
// 2. 创建地图
var map = L.map('map').setView([31.2304, 121.4737], 13); // 上海

// 3. 添加底图（使用 OpenStreetMap）
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 4. 添加标记
L.marker([31.2304, 121.4737]).addTo(map)
    .bindPopup('上海！')
    .openPopup();
```

**学习内容：**
- [ ] 创建地图、设置中心点和缩放级别
- [ ] 添加底图（图层）
- [ ] 添加标记（Marker）、折线（Polyline）、多边形（Polygon）
- [ ] 弹窗（Popup）交互
- [ ] 事件处理（点击、悬停）
- [ ] 图层控制（Layer Control）

**练习项目：** 在地图上标记你的学校或家

---

### 第三阶段：数据与 GeoJSON（Week 5-6）

#### 理解坐标系统

```
经度 (Longitude): -180° ~ +180°（东西）
纬度 (Latitude): -90° ~ +90°（南北）

中国示例：
  北京: 39.9042° N, 116.4074° E
  上海: 31.2304° N, 121.4737° E
  香港: 22.3193° N, 114.1694° E
```

#### GeoJSON 格式

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "上海",
        "population": 24870000
      },
      "geometry": {
        "type": "Point",
        "coordinates": [121.4737, 31.2304]
      }
    }
  ]
}
```

**Leaflet 加载 GeoJSON：**

```javascript
L.geoJSON(data, {
    onEachFeature: function(feature, layer) {
        layer.bindPopup(feature.properties.name);
    }
}).addTo(map);
```

**学习内容：**
- [ ] GeoJSON 格式详解
- [ ] 创建和编辑 GeoJSON
- [ ] 用 Leaflet 加载显示 GeoJSON
- [ ] 属性映射到样式
- [ ] 样式化（颜色、大小、图标）

**练习项目：** 制作中国主要城市分布地图（带人口数据）

---

### 第四阶段：样式与交互（Week 7-8）

#### Choropleth Map（分级填色图）

```javascript
function getColor(d) {
    return d > 10000000 ? '#800026' :
           d > 5000000  ? '#BD0026' :
           d > 2000000  ? '#E31A1C' :
           d > 1000000  ? '#FC4E2A' :
                          '#FFEDA0';
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties.population),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

L.geoJSON(statesData, {style: style}).addTo(map);
```

#### 交互效果

```javascript
function highlightFeature(e) {
    var layer = e.target;
    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.9
    });
    layer.bringToFront();
}

function resetHighlight(e) {
    geojsonLayer.resetStyle(e.target);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: function(e) {
            map.fitBounds(e.target.getBounds());
        }
    });
}

L.geoJSON(data, {
    onEachFeature: onEachFeature
}).addTo(map);
```

**学习内容：**
- [ ] 热力图（Heatmap）
- [ ] 分级填色图（Choropleth）
- [ ] 动态图标
- [ ] 鼠标悬停/点击交互
- [ ] 信息框（Info box）
- [ ] 图例（Legend）

**练习项目：** 制作一个中国各省人口可视化地图

---

### 第五阶段：后端与空间数据库（Week 9-12）

#### PostgreSQL + PostGIS

PostGIS 是 PostgreSQL 的空间扩展，支持地理查询。

```sql
-- 安装 PostGIS 扩展
CREATE EXTENSION postgis;

-- 创建带坐标的表
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    location GEOMETRY(Point, 4326)
);

-- 插入数据（经度, 纬度）
INSERT INTO cities (name, location) VALUES
    ('上海', ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326)),
    ('北京', ST_SetSRID(ST_MakePoint(116.4074, 39.9042), 4326));

-- 查询：找附近的城市（100km内）
SELECT name FROM cities
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(121.4737, 31.2304), 4326),
    100000  -- 单位：米
);
```

#### Node.js + Express API

```javascript
const express = require('express');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();

app.get('/api/cities', async (req, res) => {
    const result = await pool.query(
        'SELECT name, ST_AsGeoJSON(location) as geo FROM cities'
    );
    res.json(result.rows);
});

app.get('/api/nearby', async (req, res) => {
    const { lng, lat, dist } = req.query;
    const result = await pool.query(`
        SELECT name, ST_Distance(location, 
            ST_SetSRID(ST_MakePoint($1, $2), 4326)
        ) as distance
        FROM cities
        WHERE ST_DWithin(location, 
            ST_SetSRID(ST_MakePoint($1, $2), 4326), $3
        )
    `, [lng, lat, dist || 50000]);
    res.json(result.rows);
});

app.listen(3000);
```

**学习内容：**
- [ ] PostgreSQL 基础
- [ ] PostGIS 空间函数
- [ ] Node.js + Express 创建 API
- [ ] 从数据库读取 GeoJSON
- [ ] 空间查询（距离、边界）

**练习项目：** 实现"附近的人/地点"查询 API

---

### 第六阶段：地图瓦片服务（Week 13-14）

#### 瓦片原理

```
地图缩放级别 (z): 0-19
瓦片列号 (x): 0 ~ 2^z
瓦片行号 (y): 0 ~ 2^z

URL 格式：https://a.tile.openstreetmap.org/{z}/{x}/{y}.png
```

#### 瓦片服务器

使用 **Tileserver GL** 快速搭建：

```bash
# 安装
npm install -g tileserver-gl

# 启动（需要 .mbtiles 文件）
tileserver-gl --mbtiles mymap.mbtiles
```

**自托管底图：**
- MapTiler（生成 mbtiles）
- OpenMapTiles
- Landez

**学习内容：**
- [ ] 理解瓦片金字塔
- [ ] 使用开源瓦片（OSM）
- [ ] 自托管瓦片服务
- [ ] 切换不同底图

---

### 第七阶段：完整项目实战（Week 15-16）

#### 项目：校园地图应用

**功能需求：**
1. 校园底图展示
2. 教学楼标注（可点击查看信息）
3. 食堂位置及评分
4. 路线规划（起点终点）
5. 搜索功能

**技术方案：**
```
前端：HTML + CSS + JavaScript + Leaflet
后端：Node.js + Express
数据库：PostgreSQL + PostGIS
部署：Vercel (前端) + Railway/Render (后端)
```

**数据库设计：**

```sql
-- 建筑物表
CREATE TABLE buildings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),  -- 'teaching', 'dormitory', 'canteen'
    description TEXT,
    location GEOMETRY(Point, 4326)
);

-- 路线表
CREATE TABLE routes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    path GEOMETRY(LineString, 4326)
);
```

**API 设计：**

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/buildings` | GET | 获取所有建筑 |
| `/api/buildings/:id` | GET | 获取单个建筑 |
| `/api/routes` | GET | 获取路线 |
| `/api/search?q=` | GET | 搜索建筑 |

---

## 🛠️ 开发工具推荐

### 编辑器
- **VS Code** - 最推荐，安装 GeoJS 插件
- **JetBrains WebStorm** - 专业前端 IDE

### 浏览器调试
- Chrome DevTools - 网络请求、Console
- 地图右键"检查"查看元素

### 地图工具
- [geojson.io](https://geojson.io) - 在线编辑 GeoJSON
- [Mapshaper](https://mapshaper.org) - 简化 GeoJSON
- [MyHeatMap](https://www.heatmapper.ca) - 热力图生成

### 设计工具
- [Figma](https://figma.com) - UI 设计
- [Mapbox Studio](https://mapbox.com/studio) - 自定义地图样式

---

## 📂 项目文件结构

```
WebGIS-Learning/
├── README.md
├── 阶段一-前端基础/
│   └── 练习代码/
├── 阶段二-Leaflet入门/
│   ├── 01-创建地图.html
│   ├── 02-添加标记.html
│   ├── 03-图层控制.html
│   └── 04-GeoJSON加载.html
├── 阶段三-数据可视化/
│   ├── 中国城市地图/
│   └── 人口热力图/
├── 阶段四-后端开发/
│   ├── server.js
│   └── database.sql
├── 阶段五-瓦片服务/
│   └── tileserver/
└── 实战项目-校园地图/
    ├── 前端/
    └── 后端/
```

---

## 🔗 学习资源

### 官方文档（必读）
- [Leaflet 官方文档](https://leafletjs.com/reference.html)
- [OpenLayers 文档](https://openlayers.org/en/latest/doc/)
- [Mapbox GL JS 文档](https://docs.mapbox.com/mapbox-gl-js/)

### 在线教程
- [Leaflet 入门（W3Schools）](https://www.w3schools.com/ leaflet/)
- [GeoJSON 规范](https://geojson.org/)
- [PostGIS 教程](https://postgis.net/workshops/postgis-intro/)

### 开源项目参考
- [Leaflet 示例集合](https://leafletjs.com/examples.html)
- [Mapbox 示例](https://docs.mapbox.com/mapbox-gl-js/examples/)

### 视频课程
- YouTube 搜索 "Leaflet tutorial"
- B站 搜索 "WebGIS 开发教程"

---

## 📋 检查清单

### 基础技能
- [ ] HTML/CSS/JavaScript 基础
- [ ] 理解经纬度坐标
- [ ] JSON 数据格式
- [ ] Chrome DevTools 使用

### Leaflet 核心
- [ ] 创建地图
- [ ] 添加底图
- [ ] 添加标记/折线/多边形
- [ ] GeoJSON 加载
- [ ] 样式化图层
- [ ] 事件处理

### 数据处理
- [ ] GeoJSON 格式
- [ ] 坐标转换
- [ ] 数据清洗

### 后端
- [ ] PostgreSQL 基础
- [ ] PostGIS 空间查询
- [ ] RESTful API 设计

### 部署
- [ ] 前端部署（Vercel/Netlify）
- [ ] 后端部署（Railway/Render）
- [ ] 地图服务配置

---

## 🚀 下一步行动

1. **今天**：安装 VS Code，创建第一个 Leaflet 地图
2. **本周**：完成阶段一 + 阶段二
3. **下周**：开始 GeoJSON 数据可视化
4. **本月**：完成阶段四 + 发布第一个 WebGIS 项目

---

> 💡 提示：遇到问题多 Google，善用浏览器开发者工具调试！

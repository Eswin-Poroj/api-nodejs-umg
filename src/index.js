import express from "express";
import dotenv from "dotenv";
dotenv.config();
import {pool} from "./db.js";

const app = express()
const port = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Api is running");
});

// Middleware para verificar la conexión a la base de datos
function checkDbConnection(req, res, next) {
  pool.query("SELECT 1")
    .then(() => {
      // La conexión está activa, continuar
      next();
    })
    .catch(err => {
      console.error("Error de conexión a la base de datos:", err);
      res.status(503).json({ 
        error: "Error de conexión a la base de datos", 
        message: "Servicio temporalmente no disponible. Intente más tarde." 
      });
    });
}

// Aplicar middleware de verificación de conexión a las rutas que requieren base de datos
app.get("/productos", checkDbConnection, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM productos WHERE estado = 'A'");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ 
            error: "Failed to retrieve products",
            details: error.message
        }); 
    }
});

app.get("/clientes", checkDbConnection, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM clientes WHERE estado = 'A'");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        res.status(500).json({ 
            error: "Failed to retrieve clients",
            details: error.message
        }); 
    }
});

app.get("/pedidos", checkDbConnection, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT p.id_pedido, p.id_cliente, c.nombre AS nombre_cliente, p.fecha, p.total_pedido, p.estado FROM pedidos_enc p JOIN clientes c ON p.id_cliente = c.id_cliente");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener pedidos:", error);
        res.status(500).json({ 
            error: "Failed to retrieve orders",
            details: error.message
        }); 
    }
});

app.get("/detalles", checkDbConnection, async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT d.id_detalle, d.id_pedido, p.id_producto, pr.nombre AS nombre_producto, d.precio_venta, d.cantidad_venta, d.subtotal_venta FROM pedidos_det d JOIN productos pr ON d.id_producto = pr.id_producto");
        res.status(200).json(rows);
    } catch (error) {
        console.error("Error al obtener detalles de pedidos:", error);
        res.status(500).json({ 
            error: "Failed to retrieve order details",
            details: error.message
        }); 
    }
});

/// METODOS POST
app.post("/productos", checkDbConnection, async (req, res) => {
    const { nombre, precio_minimo, precio_maximo, cantidad_disponible } = req.body;
    try {
        const [result] = await pool.query("INSERT INTO productos (nombre, precio_minimo, precio_maximo, cantidad_disponible) VALUES (?, ?, ?, ?)", [nombre, precio_minimo, precio_maximo, cantidad_disponible]);
        res.status(201).json({
            message: "Product created successfully",
            id_producto: result.insertId
        });
    } catch (error) {
        console.error("Error al crear producto:", error);
        res.status(500).json({ 
            error: "Failed to create product",
            details: error.message
        }); 
        
    }
});

app.post('/clientes', checkDbConnection, async (req, res) => {
    const { nombre, email, telefono, nit } = req.body;
    try {
        const [result] = await pool.query(
            `INSERT INTO clientes (nombre, email, telefono, nit)
            VALUES (?, ?, ?, ?)`,
            [nombre, email, telefono, nit]
        );
        res.status(201).json({
            message: "Cliente creado exitosamente",
            id_cliente: result.insertId,
        });
    } catch (err) {
        console.error('Error al insertar cliente:', err);
        res.status(500).json({
            error: 'Error al insertar cliente',
            details: err.message
        });
    }
});

app.post('/pedido_enc', checkDbConnection, async (req, res) => {
    const { id_cliente, total_pedido, estado } = req.body;
    try {
        const [result] = await pool.query(
        `INSERT INTO pedido_enc (id_cliente, total_pedido, estado)
        VALUES (?, ?, ?)`,
        [id_cliente, total_pedido, estado]
        );
        res.status(201).json({
            message: "Pedido creado exitosamente",
            id_pedido: result.insertId,
        });
    } catch (err) {
        console.error('Error al insertar pedido_enc:', err);
        res.status(500).json({
            error: 'Error al insertar pedido_enc',
            details: err.message
        });
    }
});

app.post('/pedido_det', async (req, res) => {
    const { id_pedido, id_producto, precio_venta, cantidad_venta } = req.body;

    try {
        const [result] = await pool.query(
        `INSERT INTO pedido_det (id_pedido, id_producto, precio_venta, cantidad_venta)
        VALUES (?, ?, ?, ?)`,
        [id_pedido, id_producto, precio_venta, cantidad_venta]
        );

        res.json({
            message: "Detalle de pedido creado exitosamente",
            id_detalle: result.insertId,
        });
    } catch (err) {
        console.error('Error al insertar detalle de pedido:', err);
        res.status(500).json({
            error: 'Error al insertar detalle de pedido',
            details: err.message
        });
    }
});


app.listen(port, () => {  
    // Intenta probar la conexión a la base de datos al iniciar
    pool.query("SELECT 1")
        .then(() => console.log("✅ Conexión a la base de datos establecida"))
        .catch(err => console.error("❌ Error al conectar con la base de datos:", err));
});
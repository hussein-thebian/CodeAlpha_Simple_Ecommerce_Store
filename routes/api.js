const express = require('express');

module.exports= function(pool){

    const router = express.Router();

    //Products
    router.get('/products',async(req,res)=>{
        try {
            const result= await pool.query('SELECT * FROM products');
            res.json(result.rows);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    //Orders
    router.get('/orders', async (req, res) => {
        try {
            const result = await pool.query('SELECT * FROM orders');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/orders', async (req, res) => {
        const { products, totalPrice } = req.body;
    
        if (!Array.isArray(products) || products.some(p => !p.id || !p.quantity)) {
            return res.status(400).json({ error: 'Invalid products data' });
        }
    
        const query = 'INSERT INTO orders (products, total_price) VALUES ($1, $2) RETURNING *';
        try {
            const result = await pool.query(query, [JSON.stringify(products), totalPrice]);
            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
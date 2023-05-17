const bodyParser = require("body-parser");
const express = require("express");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = 5000;
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const cors = require("cors");
const session = require("express-session");
const mysql = require('mysql');
const { default: mongoose, Error } = require("mongoose");

const Category = require("./models/prodcategoryModel")
const Product = require("./models/productModel")
const User = require("./models/userModel")


const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',

});
connection.connect(function (err) {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL successfully');

});

app.use(morgan("dev"));
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(require("cookie-parser")());
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.get("/api/run", (req, res) => {
  res.json("Api running...");
});

app.get("/api/mysqldatabase", (req, res) => {
  let data = []
  connection.query('SHOW DATABASES', function (err, results) {
    if (err) {
      console.error('Error retrieving databases:', err);
      return;
    }
    console.log(results);

    const formattedArray = results.map(row => ({ name: row.Database }));

    const filteredArray = formattedArray.filter(item => {
      const name = item.name.toLowerCase();
      return name !== 'phpmyadmin' && name !== 'information_schema' && name !== 'performance_schema' && name !== 'mysql';
    });

    res.json({ database: filteredArray })

    connection.end(); // Close the connection when finished

  });

});
app.post("/api/connectmongodb", (req, res) => {
  const { url } = req.body

  mongoose.connect(url).then(() => {
    const dataToInsert = { url: url };
    connection.query(`INSERT INTO phantan.connectmongodb SET ?`, dataToInsert, function (err, result) {
      if (err) {
        res.json({ Message: 'Error inserting data:' });


      }
      res.json({ Message: "Connection successfully" });

    });

  }).catch((err) => {
    res.json({ Message: err })
  })

});

app.post("/api/distributed-mongodb", (req, res) => {
  const { idconnect, table, value, condition } = req.body

  const sql = `SELECT * FROM phantan.connectmongodb where id = ${idconnect}`;
  mongoose.disconnect()
  try {
    connection.query(sql, function (err, rows) {
      if (err) {
        console.error('Error executing SELECT query:', err);
        return;
      }
      let msgs;
      mongoose.connect(rows[0].url).then(() => {

        const sql2 = `SELECT * FROM luxubu.${table} where ${condition} = "${value}"`;

        connection.query(sql2, function (err, rows) {


          if (table == "product") {

            const products = rows.map(productData => {
              const product = { ...productData };
              delete product.RowDataPacket;
              return product;
            });

            products.map((item) => {
              let data = {
                title: item.title,
                slug: item.slug,
                description: item.description,
                price: item.price,
                category: item.category,
                brand: item.brand,
                quantity: item.quantity,
                sold: item.sold,
                images: JSON.parse(item.images),
                imagesDetail: JSON.parse(item.imagesDetail)
              }

              Product.insertMany(data)


            })
            res.json({ msg: "distributed success" })

          } else if (table == "category") {

            const formattedArray = rows.map(row => {

              return {
                id: row.id,
                title: row.title
              };

            })[0];

            Category.insertMany(formattedArray);
            res.json({ msg: "distributed success" })

          } else if (table == "user") {

            const users = rows.map(UserData => {
              const user = { ...UserData };
              delete user.RowDataPacket;
              return user;
            });

            users.map((item) => {
              let data = {
                firstname: item.firstname,
                lastname: item.lastname,
                email: item.email,
                facebookId: item.facebookId,
                googleId: item.googleId,
                mobile: item.mobile,
                password: item.password,
                role: item.role,
                isBlocked: item.isBlocked,
                address: item.address

              }

              User.insertMany(data);
            })
            res.json({ msg: "distributed success" })
          }

        });


      })

    })


  } catch (error) {

  }


});

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});

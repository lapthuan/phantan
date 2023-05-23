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

const fs = require('fs');

const Brand = require("./models/brandModel")
const Category = require("./models/prodcategoryModel")
const Product = require("./models/productModel")
const User = require("./models/userModel")
const Order = require("./models/orderModel")
const Review = require("./models/reviewModel")
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
  const { idconnect, region } = req.body

  const sql = `SELECT * FROM phantan.connectmongodb where id = ${idconnect}`;
  mongoose.disconnect()
  try {
    connection.query(sql, function (err, rows) {
      if (err) {
        console.error('Error executing SELECT query:', err);
        return;
      }

      mongoose.connect(rows[0].url).then(async () => {
        await connection.query(`SELECT * FROM luxubu.region WHERE name='${region}'`, async (err, results) => {
          if (err) {
            console.error('Lỗi truy vấn:', err);
            return;
          }
          if (results == undefined) {
            console.log("ID khu vực : " + results[0].id);
            let arrUsers = []

            connection.query(`SELECT * FROM luxubu.user WHERE idregion = ${results[0].id}`, (err, results1) => {

              const users = results1.map(UserData => {
                const user = { ...UserData };
                delete user.RowDataPacket;
                return user;
              });

              users.map((item) => {
                arrUsers.push(item.id);
                let data = {
                  id: item.id,
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

                User.findOne({ email: item.email }, function (err, user) {
                  if (err) {
                    console.error('Lỗi tìm kiếm người dùng:', err);
                  } else {
                    if (user) {
                      console.log('Người dùng đã có');
                    } else {
                      User.insertMany(data)
                    }
                  }
                });


              })
              connection.query(`SELECT * FROM luxubu.orders WHERE orderby IN (${arrUsers.join()})`, (err, results) => {
                const orders = results.map(orderData => {
                  const order = { ...orderData };
                  delete order.RowDataPacket;
                  return order;
                });
                orders.map((item) => {
                  let data = {
                    id: item.id,
                    products: JSON.parse(item.products),
                    paymentIntent: JSON.parse(item.paymentIntent),
                    orderStatus: item.orderStatus,
                    orderby: item.orderby
                  }
                  Order.findOne({ id: item.id }, function (err, od) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (od) {
                        console.log('Đơn hàng đã tồn tại');
                      } else {
                        Order.insertMany(data)
                      }
                    }
                  });
                })

              });
              connection.query(`SELECT * FROM luxubu.reviews WHERE iduser IN (${arrUsers.join()})`, (err, results) => {
                const reviews = results.map(reviewData => {
                  const review = { ...reviewData };
                  delete review.RowDataPacket;
                  return review;
                });

                reviews.map((item) => {
                  let data = {
                    id: item.id,
                    description: item.description,
                    rate: item.rate,
                    iduser: item.iduser,
                    idproduct: item.idproduct
                  }
                  Review.findOne({ id: item.id }, function (err, rv) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (rv) {
                        console.log('Đánh giá đã tồn tại');
                      } else {
                        Review.insertMany(data)
                      }
                    }
                  });
                })

              });
              connection.query(`SELECT * FROM luxubu.product `, (err, results) => {
                const products = results.map(productData => {
                  const product = { ...productData };
                  delete product.RowDataPacket;
                  return product;
                });
                products.map((item) => {
                  let data = {
                    id: item.id,
                    title: item.title,
                    slug: item.slug,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    brand: item.brand,
                    images: JSON.parse(item.images),
                    imagesDetail: JSON.parse(item.imagesDetail)
                  }
                  Product.findOne({ id: item.id }, function (err, pr) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (pr) {
                        console.log('Sản phẩm đã tồn tại');
                      } else {
                        Product.insertMany(data)
                      }
                    }
                  });

                })


              });
              connection.query(`SELECT * FROM luxubu.category `, (err, results) => {
                const categorys = results.map(categoryData => {
                  const category = { ...categoryData };
                  delete category.RowDataPacket;
                  return category;
                });
                categorys.map((item) => {
                  let data = {
                    id: item.id,
                    title: item.title
                  }
                  Category.findOne({ id: item.id }, function (err, cate) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (cate) {
                        console.log('Category đã tồn tại');
                      } else {
                        Category.insertMany(data)
                      }
                    }
                  });

                })


              });
              connection.query(`SELECT * FROM luxubu.brand `, (err, results) => {
                const brands = results.map(brandData => {
                  const brand = { ...brandData };
                  delete brand.RowDataPacket;
                  return brand;
                });
                brands.map((item) => {
                  let data = {
                    id: item.id,
                    title: item.title
                  }
                  Brand.findOne({ id: item.id }, function (err, br) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (br) {
                        console.log('Brand đã tồn tại');
                      } else {
                        Brand.insertMany(data)
                      }
                    }
                  });

                })


              });

              console.log(arrUsers);
            });
            res.json({ msg: "Phân tán thành công" })

          } else {
            res.json({ msg: "Không tìm thấy miền này" })
          }

        });

      })

    })


  } catch (error) {
    throw new Error(error)
  }


});
app.post("/api/distributed-firebase", (req, res) => {
  // const firebaseConfig = {
  //   apiKey: "AIzaSyCD6veqV8DhhWge9-tmR6LNs_RpicY9N2c",
  //   authDomain: "phantan-a8c7a.firebaseapp.com",
  //   projectId: "phantan-a8c7a",
  //   storageBucket: "phantan-a8c7a.appspot.com",
  //   messagingSenderId: "743022799960",
  //   appId: "1:743022799960:web:ba3ff709aaa5ece4296e2d",
  //   measurementId: "G-EX70R13Q8R"
  // };
  // initializeApp();

  // const db = getFirestore();

  // const docRef = db.collection('users').doc('alovelace');

  // docRef.set({
  //   first: 'Ada',
  //   last: 'Lovelace',
  //   born: 1815
  // });
  // const user = {
  //   id: '2',
  //   firstname: 'Trần',
  //   lastname: 'Thị B',
  //   email: 'tranthib@example.com',
  //   facebookId: '987654321',
  //   googleId: 'gfedcba',
  //   mobile: '0123456789',
  //   password: '$2b$10$pa.mOmeP6sfoc4aHCRERBO0Y0guxM5zaGoEXR9r6EEO1YkvviZmpm',
  //   role: 'user',
  //   isBlocked: false,
  //   cart: [],
  //   address: '456 Đường XYZ, Thành phố ABC',
  //   wishlist: [],
  //   __v: 0,
  //   createdAt: { $date: '2023-05-23T02:52:31.036Z' },
  //   updatedAt: { $date: '2023-05-23T02:52:31.036Z' }
  // };

  // createUser(user);

});

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
  console.log(`Server is running at PORT ${PORT}`);
});

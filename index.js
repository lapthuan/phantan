const bodyParser = require("body-parser");
const express = require("express");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const app = express();
const dotenv = require("dotenv").config();
const PORT = 4000;
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
const Review = require("./models/review")
const BlogCat = require("./models/blogCatModel")
const Blog = require("./models/blogModel");
const contactModel = require("./models/contactModel");
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
  const { ConnectMongodb, colums, value } = req.body

  mongoose.disconnect()
  mongoose.connect(ConnectMongodb).then(async () => {
    await connection.query(`SHOW COLUMNS FROM luxubu.provinces LIKE '${colums}'`, async (error, results) => {

      const columnExists = results.length > 0;
      //Kiểm tra có column đó không
      if (columnExists) {

        await connection.query(`SELECT * FROM luxubu.provinces WHERE ${colums} like '%${value}'`, async (err, results) => {

          if (results.length != 0) {

            console.log("ID tỉnh : " + results[0].id);
            let arrUsers = [];

            // Để kiểm tra có dữ liệu tỉnh đó không trước khi thêm dữ liệu 
            setTimeout(() => {

              if (arrUsers.length == 0) {
                res.json({ message: `Không có dữ liệu tỉnh này ${value}` });
              } else {
                connection.query(`SELECT * FROM luxubu.categories `, (err, results) => {
                  const categorys = results.map(categoryData => {
                    const category = { ...categoryData };
                    delete category.RowDataPacket;
                    return category;
                  });
                  categorys.map((item) => {
                    let data = {
                      _id: item.id,
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
                connection.query(`SELECT * FROM luxubu.brands `, (err, results) => {
                  const brands = results.map(brandData => {
                    const brand = { ...brandData };
                    delete brand.RowDataPacket;
                    return brand;
                  });

                  brands.map((item) => {
                    let data = {
                      _id: item.id,
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
                connection.query('SELECT * FROM luxubu.images JOIN luxubu.products  ON images.product_id = products.id', (error, results, fields) => {
                  if (error) throw error;

                  const products = {};

                  results.forEach(row => {
                    const { id, url, title, slug, description, price, category_id, brand_id, quantity, sold, public_id } = row;

                    if (!products[id]) {
                      products[id] = {
                        _id: id,
                        title: title,
                        slug: slug,
                        description: description,
                        price: price,
                        category: category_id,
                        brand: brand_id,
                        quantity: quantity,
                        sold: sold,
                        images: []
                      };
                    }

                    products[id].images.push({
                      public_id: public_id,
                      url: url
                    });
                  });

                  const jsonResult = Object.values(products);

                  jsonResult.map((item) => {
                    Product.findOne({ _id: item._id }, function (err, pr) {
                      if (err) {
                        console.error('Lỗi tìm kiếm người dùng:', err);
                      } else {

                        if (pr) {
                          console.log('Sản phẩm đã tồn tại');
                        } else {
                          Product.insertMany(item)
                        }
                      }
                    });

                  })

                });
                connection.query(`SELECT * FROM luxubu.cateblog `, (err, results) => {
                  const cateblogs = results.map(cateblogsData => {
                    const cateblog = { ...cateblogsData };
                    delete cateblog.RowDataPacket;
                    return cateblog;
                  });

                  cateblogs.map((item) => {
                    let data = {
                      _id: item.id,
                      title: item.name
                    }

                    BlogCat.findOne({ id: item.id }, function (err, br) {
                      if (err) {
                        console.error('Lỗi tìm kiếm người dùng:', err);
                      } else {
                        if (br) {
                          console.log('BlogCategory đã tồn tại');
                        } else {
                          BlogCat.insertMany(data)
                        }
                      }
                    });

                  })


                });
                connection.query(`SELECT * FROM luxubu.blog `, (err, results) => {
                  const blogs = results.map(blogsData => {
                    const blog = { ...blogsData };
                    delete blog.RowDataPacket;
                    return blog;
                  });

                  blogs.map((item) => {
                    let data = {
                      _id: item.id,
                      title: item.title,
                      description: item.description,
                      category: item.idcateblog,
                      images: JSON.parse(item.images)
                    }

                    Blog.findOne({ id: item.id }, function (err, br) {
                      if (err) {
                        console.error('Lỗi tìm kiếm người dùng:', err);
                      } else {
                        if (br) {
                          console.log('blog đã tồn tại');
                        } else {
                          Blog.insertMany(data)
                        }
                      }
                    });

                  })


                });
                connection.query(`SELECT * FROM luxubu.contacts `, (err, results) => {
                  const contacts = results.map(contactData => {
                    const contact = { ...contactData };
                    delete contact.RowDataPacket;
                    return contact;
                  });

                  contacts.map((item) => {
                    let data = {
                      _id: item.id,
                      name: item.name,
                      email: item.email,
                      phone: item.phone,
                      message: item.message
                    }

                    contactModel.findOne({ _id: item.id }, function (err, br) {
                      if (err) {
                        console.error('Lỗi tìm kiếm người dùng:', err);
                      } else {
                        if (br) {
                          console.log('contact đã tồn tại');
                        } else {
                          contactModel.insertMany(data)
                        }
                      }
                    });

                  })


                });

                res.json({ message: `Phân tán thành công khu vực ${value}` })

              }
            }, 4000);

            await connection.query(`SELECT * FROM luxubu.users WHERE idprovinces = ${results[0].id}`, async (err, results1) => {

              const users = results1.map(UserData => {
                const user = { ...UserData };
                delete user.RowDataPacket;
                return user;
              });

              await users.map((item) => {
                arrUsers.push(item.id);
                let data = {
                  _id: item.id,
                  firstname: item.firstname,
                  lastname: item.lastname,
                  email: item.email,
                  facebookId: item.facebookId,
                  googleId: item.googleId,
                  mobile: item.mobile,
                  password: item.password,
                  role: item.role,
                  isBlocked: item.isBlocked,
                }

                User.findOne({ _id: item.id }, function (err, user) {
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
              await connection.query(`SELECT order.id , order.orderStatus,order.totalPrice,order.orderby,orderdetail.productid,orderdetail.quantity,order.paymentid,payments.method_name
              FROM luxubu.orderdetail 
              JOIN luxubu.order ON orderdetail.orderid = order.id 
              JOIN luxubu.users ON users.id = order.orderby 
              JOIN luxubu.payments ON payments.id = order.paymentid 
              JOIN luxubu.products ON products.id = orderdetail.productid 
              WHERE order.orderby in ('${arrUsers.join('\', \'')}')`, (error, results, fields) => {

                const orders = {};

                results?.forEach(row => {
                  if (!orders[row.id]) {
                    orders[row.id] = {
                      _id: row.id,
                      products: [],
                      paymentIntent: {},
                      orderStatus: row.orderStatus,
                      totalPrice: row.totalPrice,
                      orderby: row.orderby,
                    };
                  }

                  orders[row.id].products.push({
                    product: row.productid,
                    qty: row.quantity
                  });
                  orders[row.id].paymentIntent = {
                    id: row.paymentid,
                    name: row.method_name
                  };
                });

                const jsonResult = Object.values(orders);

                jsonResult.map((item) => {

                  Order.findOne({ _id: item._id }, function (err, pr) {
                    if (err) {
                      console.error('Lỗi tìm kiếm người dùng:', err);
                    } else {
                      if (pr) {
                        console.log('Order đã tồn tại');
                      } else {
                        Order.insertMany(item)
                      }
                    }
                  });

                })
              });

              await connection.query(`SELECT * FROM luxubu.reviews WHERE reviews.user_id in ('${arrUsers.join('\', \'')}')`,
                (error, results, fields) => {

                  const reviews = {};

                  results?.forEach(row => {
                    if (!reviews[row.id]) {
                      reviews[row.id] = {
                        _id: row.id,
                        product: row.product_id,
                        user: row.user_id,
                        title: row.title,
                        rating: row.rating,
                        review: row.review,
                        status: row.status,
                      };
                    }

                  });

                  const jsonResult = Object.values(reviews);

                  jsonResult.map((item) => {

                    Review.findOne({ _id: item._id }, function (err, pr) {
                      if (err) {
                        console.error('Lỗi tìm kiếm người dùng:', err);
                      } else {
                        if (pr) {
                          console.log('Review đã tồn tại');
                        } else {
                          Review.insertMany(item)
                        }
                      }
                    });

                  })
                });
            });

          } else {
            // Hiển thị table đang có 
            await connection.query(`SHOW COLUMNS FROM luxubu.provinces `, async (error, results) => {
              res.json({ msg: "Không tìm thấy miền này", columns: results })
            })
          }

        });
      } else {
        res.json({ message: `Không tim thấy cột ${colums}` })

      }

    });
  }).catch(() => {
    res.json({ message: "Không tim thấy kết nối" })
  })

})



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

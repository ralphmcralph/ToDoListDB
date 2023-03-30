//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

const workItems = [];

//La línea app.set es para configurar EJS como motor de plantillas
app.set("view engine", "ejs");

//La línea app.use es para usar el middleware body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Conexión a la base de datos
mongoose.connect(
  "mongodb+srv://admin-rhm:Test123@cluster0.ovis6ig.mongodb.net/todoListDB"
);

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  async function findAllItems() {
    // Use the find() method to search for all fruits
    try {
      const items = await Item.find();
      let itemsNames = [];

      for (const elements of items) {
        itemsNames.push(elements);
      }

      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items to DB.");
            res.redirect("/");
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        res.render("list", { listTitle: "Today", listItem: itemsNames });
      }
    } catch (error) {
      console.log(error);
    }
  }

  findAllItems();
});

app.post("/", function (req, res) {
  const item = req.body.newItem;
  const listName = req.body.listType;

  const newItem = new Item({
    name: item,
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listGivenName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItem)
      .then(function () {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } }
    )
      .then(function () {
        console.log("Successfully deleted checked item.");
        res.redirect("/" + listName);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list
          .save()
          .then(function () {
            res.redirect("/" + customListName);
          })
          .catch(function (error) {
            console.log(error);
          });
      } else {
        res.render("list", {
          listTitle: foundList.name,
          listItem: foundList.items,
        });
      }
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT, function () {
  console.log("Server started on port " + process.env.PORT);
});

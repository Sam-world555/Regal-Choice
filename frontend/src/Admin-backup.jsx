import { useEffect, useState } from "react";
import axios from "axios";

function Admin() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [image1, setImage1] = useState("");
  const [image2, setImage2] = useState("");
  const [image3, setImage3] = useState("");
  const [image4, setImage4] = useState("");

  const fetchProducts = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/products"
      );
      setProducts(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const productData = {
      name,
      price,
      category,
      description,
      image: image1,
      images: [
        image1,
        image2,
        image3,
        image4,
      ].filter((img) => img !== ""),
    };

    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5000/api/products/${editingId}`,
          productData
        );

        alert("Product Updated Successfully!");
      } else {
        await axios.post(
          "http://localhost:5000/api/products",
          productData
        );

        alert("Product Added Successfully!");
      }

      setEditingId(null);
      setName("");
      setPrice("");
      setCategory("");
      setDescription("");

      setImage1("");
      setImage2("");
      setImage3("");
      setImage4("");

      fetchProducts();
    } catch (error) {
      console.log(error);
      alert("Something went wrong.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/products/${id}`
      );

      alert("Product Deleted!");
      fetchProducts();
    } catch (error) {
      console.log(error);
      alert("Failed to delete product.");
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);

    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setDescription(product.description);

    setImage1(product.images?.[0] || "");
    setImage2(product.images?.[1] || "");
    setImage3(product.images?.[2] || "");
    setImage4(product.images?.[3] || "");
  };

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Image 1 URL"
          value={image1}
          onChange={(e) =>
            setImage1(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Image 2 URL"
          value={image2}
          onChange={(e) =>
            setImage2(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Image 3 URL"
          value={image3}
          onChange={(e) =>
            setImage3(e.target.value)
          }
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Image 4 URL"
          value={image4}
          onChange={(e) =>
            setImage4(e.target.value)
          }
        />

        <br />
        <br />

        <button type="submit">
          {editingId
            ? "Update Product"
            : "Add Product"}
        </button>
      </form>

      <hr />

      <h2>All Products</h2>

      {products.map((product) => (
        <div
          key={product._id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            marginBottom: "10px",
          }}
        >
          <h3>{product.name}</h3>
          <p>₹{product.price}</p>
          <p>{product.category}</p>

          <button
            onClick={() =>
              handleEdit(product)
            }
          >
            Edit Product
          </button>

          {" "}

          <button
            onClick={() =>
              handleDelete(product._id)
            }
          >
            Delete Product
          </button>
        </div>
      ))}
    </div>
  );
}

export default Admin;
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const UNITS = ["Pcs", "Kg", "Liter", "Packet", "Box", "Meter", "Unit"];

// ❌ THEME object DELETE ho gaya

// ✅ currentTheme prop ADD ho gaya
const ItemManager = ({ db, storage, categories, items, setItems, currentTheme }) => {
  const [nextItemCode, setNextItemCode] = useState(101);
  const [itemForm, setItemForm] = useState({
    itemCode: "",
    itemName: "",
    barcode: "",
    category: "",
    unit: "Pcs",
    purchasePrice: "",
    sellPrice: "",
    stockQuantity: "0",
  });

  const [editingItem, setEditingItem] = useState(null);
  const [itemPicture, setItemPicture] = useState(null);
  const [itemPicturePreview, setItemPicturePreview] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);
  const [barcodeError, setBarcodeError] = useState("");

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (!editingItem) {
      setItemForm((prev) => ({ ...prev, itemCode: nextItemCode.toString() }));
    }
  }, [nextItemCode, editingItem]);

  const loadItems = async () => {
    try {
      const itemsCol = collection(db, "items");
      const itemSnapshot = await getDocs(itemsCol);
      const itemList = itemSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let maxCode = 100;
      if (itemList.length > 0) {
        maxCode = Math.max(...itemList.map((i) => parseInt(i.itemCode) || 100));
      }
      setNextItemCode(maxCode + 1);

      setItems(itemList);
    } catch (error) {
      console.error("Error loading items: ", error);
      alert("Error loading items. Check console.");
    }
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setItemForm((prev) => ({ ...prev, [name]: value }));

    if (name === "barcode") {
      setBarcodeError("");
    }
  };

  const validateBarcode = async (barcode, currentItemId = null) => {
    if (!barcode) return true;

    try {
      const itemsCol = collection(db, "items");
      const q = query(itemsCol, where("barcode", "==", barcode));
      const querySnapshot = await getDocs(q);

      if (
        !querySnapshot.empty &&
        querySnapshot.docs.some((doc) => doc.id !== currentItemId)
      ) {
        setBarcodeError("This barcode already exists!");
        return false;
      }
      setBarcodeError("");
      return true;
    } catch (error) {
      console.error("Error validating barcode: ", error);
      return true;
    }
  };

  const handleItemPictureChange = (e) => {
    if (e.target.files[0]) {
      setItemPicture(e.target.files[0]);
      setItemPicturePreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setItemPicture(null);
      setItemPicturePreview(null);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setItemForm({
      itemCode: item.itemCode || "",
      itemName: item.itemName || "",
      barcode: item.barcode || "",
      category: item.category || "",
      unit: item.unit || "Pcs",
      purchasePrice: (item.purchasePrice || "").toString(),
      sellPrice: (item.sellPrice || "").toString(),
      stockQuantity: (item.stockQuantity || "0").toString(),
    });
    setItemPicture(null);
    setItemPicturePreview(item.pictureURL || null);
    setBarcodeError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateItem = async () => {
    if (
      !itemForm.itemName ||
      !itemForm.category ||
      !itemForm.purchasePrice ||
      !itemForm.sellPrice ||
      !editingItem
    ) {
      alert(
        "Please fill all required fields and ensure an item is selected for update."
      );
      return;
    }

    if (itemForm.barcode) {
      const isValid = await validateBarcode(itemForm.barcode, editingItem.id);
      if (!isValid) {
        alert("Barcode already exists. Please use a different barcode.");
        return;
      }
    }

    setLoadingItem(true);
    let pictureURL = itemPicturePreview;

    try {
      if (itemPicture) {
        const storageRef = ref(
          storage,
          `item_pictures/${itemForm.itemCode}_${itemPicture.name}`
        );
        const snapshot = await uploadBytes(storageRef, itemPicture);
        pictureURL = await getDownloadURL(snapshot.ref);
      }

      const itemRef = doc(db, "items", editingItem.id);
      await updateDoc(itemRef, {
        ...itemForm,
        pictureURL: pictureURL,
        purchasePrice: parseFloat(itemForm.purchasePrice),
        sellPrice: parseFloat(itemForm.sellPrice),
        stockQuantity: parseInt(itemForm.stockQuantity) || 0,
        updatedAt: new Date().toISOString(),
      });

      alert(`Item "${itemForm.itemName}" updated successfully!`);
      handleClearForm();
      loadItems();
    } catch (error) {
      console.error("Error updating item: ", error);
      alert("Error updating item. Check console.");
    } finally {
      setLoadingItem(false);
    }
  };

  const handleSaveItem = async () => {
    if (
      !itemForm.itemName ||
      !itemForm.category ||
      !itemForm.purchasePrice ||
      !itemForm.sellPrice
    ) {
      alert("Please fill all required fields.");
      return;
    }

    if (itemForm.barcode) {
      const isValid = await validateBarcode(itemForm.barcode);
      if (!isValid) {
        alert("Barcode already exists. Please use a different barcode.");
        return;
      }
    }

    setLoadingItem(true);
    let pictureURL = null;

    try {
      if (itemPicture) {
        const storageRef = ref(
          storage,
          `item_pictures/${itemForm.itemCode}_${itemPicture.name}`
        );
        const snapshot = await uploadBytes(storageRef, itemPicture);
        pictureURL = await getDownloadURL(snapshot.ref);
      }

      const itemsCol = collection(db, "items");
      await addDoc(itemsCol, {
        ...itemForm,
        pictureURL: pictureURL,
        purchasePrice: parseFloat(itemForm.purchasePrice),
        sellPrice: parseFloat(itemForm.sellPrice),
        stockQuantity: parseInt(itemForm.stockQuantity) || 0,
        createdAt: new Date().toISOString(),
      });

      alert(`Item "${itemForm.itemName}" saved successfully!`);
      handleClearForm();
      loadItems();
    } catch (error) {
      console.error("Error saving item: ", error);
      alert("Error saving item. Check console.");
    } finally {
      setLoadingItem(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "items", itemId));
        alert("Item deleted successfully!");
        if (editingItem && editingItem.id === itemId) {
          handleClearForm();
        }
        loadItems();
      } catch (error) {
        console.error("Error deleting item: ", error);
        alert("Error deleting item. Check console.");
      }
    }
  };

  const handleClearForm = () => {
    setItemForm({
      itemCode: nextItemCode.toString(),
      itemName: "",
      barcode: "",
      category: "",
      unit: "Pcs",
      purchasePrice: "",
      sellPrice: "",
      stockQuantity: "0",
    });
    setItemPicture(null);
    setItemPicturePreview(null);
    setBarcodeError("");
    setEditingItem(null);
  };

  const handleFormSubmit = editingItem ? handleUpdateItem : handleSaveItem;

  return (
    <div>
      <div style={{ marginBottom: "36px" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "700",
            margin: "0 0 4px 0",
            color: currentTheme.TEXT_PRIMARY,
          }}
        >
          {editingItem ? "Edit Existing Item 📝" : "Add New Item / Product 📦"}
        </h1>
        <p style={{ fontSize: "15px", color: currentTheme.TEXT_SECONDARY, margin: 0 }}>
          {editingItem
            ? `Editing: ${
                editingItem.itemName || "Item Code " + itemForm.itemCode
              }`
            : "Define product details, prices, barcode, and upload pictures."}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "32px",
        }}
      >
        <div
          style={{
            background: currentTheme.CARD_BG,
            padding: "40px",
            borderRadius: "12px",
            boxShadow: currentTheme.SHADOW_MD,
            border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: currentTheme.TEXT_PRIMARY,
              }}
            >
              Item Code *
            </label>
            <input
              type="text"
              name="itemCode"
              value={itemForm.itemCode}
              onChange={handleItemInputChange}
              disabled={!!editingItem}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
                background: currentTheme.SIDEBAR_BG,
                color: currentTheme.TEXT_MUTED,
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: currentTheme.TEXT_MUTED,
                margin: "6px 0 0 0",
              }}
            >
              {editingItem
                ? "Code cannot be changed during edit."
                : "Autofilled for new items."}
            </p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: currentTheme.TEXT_PRIMARY,
              }}
            >
              Barcode Number 🔍
              <span
                style={{
                  fontWeight: "400",
                  fontSize: "12px",
                  color: currentTheme.TEXT_MUTED,
                  marginLeft: "8px",
                }}
              >
                (Optional - Scan or type)
              </span>
            </label>
            <input
              type="text"
              name="barcode"
              placeholder="Scan barcode or type manually (e.g., 123456789012)"
              value={itemForm.barcode}
              onChange={handleItemInputChange}
              onBlur={(e) => {
                if (e.target.value) {
                  validateBarcode(
                    e.target.value,
                    editingItem ? editingItem.id : null
                  );
                }
              }}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${
                  barcodeError ? currentTheme.PRIMARY : currentTheme.SIDEBAR_HOVER
                }`,
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
                background: currentTheme.SIDEBAR_BG,
                color: currentTheme.TEXT_PRIMARY,
                outline: barcodeError
                  ? `2px solid ${currentTheme.PRIMARY}40`
                  : "none",
              }}
            />
            {barcodeError && (
              <p
                style={{
                  fontSize: "12px",
                  color: currentTheme.PRIMARY,
                  margin: "6px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>⚠️</span> {barcodeError}
              </p>
            )}
            <p
              style={{
                fontSize: "12px",
                color: currentTheme.TEXT_MUTED,
                margin: "6px 0 0 0",
              }}
            >
              💡 Use a barcode scanner or type the barcode manually
            </p>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: currentTheme.TEXT_PRIMARY,
              }}
            >
              Item Name *
            </label>
            <input
              type="text"
              name="itemName"
              placeholder="e.g., Tandoori Burger"
              value={itemForm.itemName}
              onChange={handleItemInputChange}
              style={{
                width: "100%",
                padding: "14px 16px",
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                borderRadius: "8px",
                fontSize: "15px",
                boxSizing: "border-box",
                background: currentTheme.SIDEBAR_BG,
                color: currentTheme.TEXT_PRIMARY,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                Category *
              </label>
              <select
                name="category"
                value={itemForm.category}
                onChange={handleItemInputChange}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  background: currentTheme.SIDEBAR_BG,
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.categoryName}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                Unit *
              </label>
              <select
                name="unit"
                value={itemForm.unit}
                onChange={handleItemInputChange}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  background: currentTheme.SIDEBAR_BG,
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "28px" }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                Purchase Price (Rs) *
              </label>
              <input
                type="number"
                name="purchasePrice"
                placeholder="e.g., 180"
                value={itemForm.purchasePrice}
                onChange={handleItemInputChange}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  background: currentTheme.SIDEBAR_BG,
                  color: currentTheme.TEXT_PRIMARY,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  fontSize: "14px",
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                Sell Price (Rs) *
              </label>
              <input
                type="number"
                name="sellPrice"
                placeholder="e.g., 250"
                value={itemForm.sellPrice}
                onChange={handleItemInputChange}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                  borderRadius: "8px",
                  fontSize: "15px",
                  boxSizing: "border-box",
                  background: currentTheme.SIDEBAR_BG,
                  color: currentTheme.TEXT_PRIMARY,
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                fontSize: "14px",
                color: currentTheme.TEXT_PRIMARY,
              }}
            >
              Item Picture {editingItem ? "(Upload new to replace)" : ""}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleItemPictureChange}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: `2px dashed ${currentTheme.SIDEBAR_HOVER}`,
                borderRadius: "8px",
                fontSize: "14px",
                boxSizing: "border-box",
                cursor: "pointer",
                background: currentTheme.SIDEBAR_BG,
                color: currentTheme.TEXT_SECONDARY,
              }}
            />
            <p
              style={{
                fontSize: "12px",
                color: currentTheme.TEXT_MUTED,
                margin: "6px 0 0 0",
              }}
            >
              JPG, PNG (Max 5MB)
            </p>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={handleFormSubmit}
              disabled={loadingItem || barcodeError}
              style={{
                background:
                  loadingItem || barcodeError
                    ? currentTheme.SIDEBAR_HOVER
                    : currentTheme.GRADIENT_PRIMARY,
                color: "white",
                padding: "14px 36px",
                border: "none",
                borderRadius: "8px",
                cursor: loadingItem || barcodeError ? "not-allowed" : "pointer",
                fontSize: "15px",
                fontWeight: "600",
                opacity: loadingItem || barcodeError ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!loadingItem && !barcodeError) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(239, 68, 68, 0.4)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(239, 68, 68, 0.3)";
              }}
            >
              {loadingItem
                ? editingItem
                  ? "Updating..."
                  : "Saving..."
                : editingItem
                ? "Update Item"
                : "Save Item"}
            </button>
            <button
              onClick={handleClearForm}
              style={{
                background: currentTheme.SIDEBAR_BG,
                color: currentTheme.TEXT_PRIMARY,
                padding: "14px 36px",
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = currentTheme.SIDEBAR_HOVER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = currentTheme.SIDEBAR_BG;
              }}
            >
              {editingItem ? "Cancel Edit" : "Clear Form"}
            </button>
          </div>
        </div>

        <div>
          {(itemPicturePreview || editingItem?.pictureURL) && (
            <div style={{ marginBottom: "28px" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  margin: "0 0 12px 0",
                  color: currentTheme.TEXT_PRIMARY,
                }}
              >
                Picture Preview
              </h3>
              <img
                src={itemPicturePreview || editingItem?.pictureURL}
                alt="preview"
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                }}
              />
            </div>
          )}
          <div>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: "700",
                margin: "0 0 12px 0",
                color: currentTheme.TEXT_PRIMARY,
              }}
            >
              Saved Items ({items.length})
            </h3>
            <div
              style={{
                background: currentTheme.CARD_BG,
                borderRadius: "12px",
                boxShadow: currentTheme.SHADOW_MD,
                border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    padding: "30px 16px",
                    textAlign: "center",
                    color: currentTheme.TEXT_MUTED,
                    fontSize: "13px",
                  }}
                >
                  No items yet
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "16px",
                      borderBottom: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
                      opacity:
                        editingItem && editingItem.id !== item.id ? 0.5 : 1,
                    }}
                  >
                    {item.pictureURL && (
                      <img
                        src={item.pictureURL}
                        alt={item.itemName}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          marginBottom: "10px",
                        }}
                      />
                    )}
                    <div
                      style={{
                        marginBottom: "8px",
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: `${currentTheme.PRIMARY}20`,
                          color: currentTheme.PRIMARY,
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        {item.itemCode}
                      </span>
                      {item.barcode && (
                        <span
                          style={{
                            background: `${currentTheme.ACCENT_SUCCESS}20`,
                            color: currentTheme.ACCENT_SUCCESS,
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "4px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          🔍 {item.barcode}
                        </span>
                      )}
                      <span
                        style={{
                          background: `${currentTheme.TEXT_MUTED}20`,
                          color: currentTheme.TEXT_MUTED,
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "4px 8px",
                          borderRadius: "4px",
                        }}
                      >
                        Stock: {item.stockQuantity || "0"} {item.unit || "Pcs"}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: currentTheme.TEXT_PRIMARY,
                        margin: "0 0 4px 0",
                      }}
                    >
                      {item.itemName}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: currentTheme.TEXT_MUTED,
                        margin: "0 0 8px 0",
                      }}
                    >
                      {item.category}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: currentTheme.ACCENT_SUCCESS,
                        margin: "0 0 2px 0",
                      }}
                    >
                      Cost: Rs {item.purchasePrice || "0"} /{" "}
                      {item.unit || "Pcs"}
                    </p>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: currentTheme.PRIMARY,
                        margin: "0 0 8px 0",
                      }}
                    >
                      Sell: Rs {item.sellPrice || item.price} /{" "}
                      {item.unit || "Pcs"}
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEditClick(item)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: `${currentTheme.PRIMARY}40`,
                          color: currentTheme.TEXT_PRIMARY,
                          border: `1px solid ${currentTheme.PRIMARY}80`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = currentTheme.PRIMARY;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${currentTheme.PRIMARY}40`;
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          background: `${currentTheme.PRIMARY}20`,
                          color: currentTheme.PRIMARY,
                          border: `1px solid ${currentTheme.PRIMARY}40`,
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = currentTheme.PRIMARY;
                          e.currentTarget.style.color = "white";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${currentTheme.PRIMARY}20`;
                          e.currentTarget.style.color = currentTheme.PRIMARY;
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
            </div>
      </div>
    </div>
  );
};

export default ItemManager;

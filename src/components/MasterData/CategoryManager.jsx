import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ❌ THEME object DELETE HO GAYA - Ab Dashboard se aayega!

// ✅ currentTheme PROP ADD HO GAYA
const CategoryManager = ({ 
  db, 
  categories, 
  setCategories, 
  loadItems, 
  onCategorySelect,
  currentTheme  // 👈 YEH NAYA PROP HAI
}) => {
  const [categoryName, setCategoryName] = useState("");
  const [nextCategoryId, setNextCategoryId] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [categories.length]);

  const loadCategories = async () => {
    try {
      const categoriesCol = collection(db, "categories");
      const categorySnapshot = await getDocs(categoriesCol);
      const categoryList = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let maxId = 0;
      if (categoryList.length > 0) {
        maxId = Math.max(
          ...categoryList.map((c) => parseInt(c.categoryId) || 0)
        );
      }
      setNextCategoryId(maxId + 1);

      setCategories(categoryList);
    } catch (error) {
      console.error("Error loading categories: ", error);
      alert("Error loading categories. Check console.");
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryName) {
      alert("Please enter a Category Name.");
      return;
    }

    try {
      const categoriesCol = collection(db, "categories");
      await addDoc(categoriesCol, {
        categoryId: nextCategoryId.toString(),
        categoryName: categoryName,
        createdAt: new Date().toISOString(),
      });

      alert(`Category "${categoryName}" saved successfully!`);
      setCategoryName("");
      loadCategories();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error saving category. Check console.");
    }
  };

  const handleDeleteCategory = async (categoryDocId, categoryName) => {
    if (
      window.confirm(
        `Are you sure you want to delete category: ${categoryName}?`
      )
    ) {
      try {
        await deleteDoc(doc(db, "categories", categoryDocId));
        alert(`Category "${categoryName}" deleted successfully!`);
        loadCategories();
        loadItems();
      } catch (error) {
        console.error("Error deleting category: ", error);
        alert("Error deleting category. Check console.");
      }
    }
  };

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "36px" }}>
        <h1
          style={{
            fontSize: "30px",
            fontWeight: "700",
            margin: "0 0 4px 0",
            color: currentTheme.TEXT_PRIMARY,  // 🔄 THEME → currentTheme
          }}
        >
          Add New Category 🏷️
        </h1>
        <p style={{ fontSize: "15px", color: currentTheme.TEXT_SECONDARY, margin: 0 }}>
          Add and manage product groups to organize your items.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "32px",
        }}
      >
        <div
          style={{
            background: currentTheme.CARD_BG,  // 🔄 THEME → currentTheme
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
              Category ID
            </label>
            <input
              type="text"
              value={nextCategoryId}
              disabled
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
              Category Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Mobile, Laptop, Accessories"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
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
          <button
            onClick={handleSaveCategory}
            style={{
              background: currentTheme.GRADIENT_PRIMARY,
              color: "white",
              padding: "14px 36px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(239, 68, 68, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
            }}
          >
            Save Category
          </button>
        </div>

        <div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              margin: "0 0 16px 0",
              color: currentTheme.TEXT_PRIMARY,
            }}
          >
            Saved Categories ({categories.length})
          </h2>
          <div
            style={{
              background: currentTheme.CARD_BG,
              borderRadius: "12px",
              boxShadow: currentTheme.SHADOW_MD,
              border: `1px solid ${currentTheme.SIDEBAR_HOVER}`,
              maxHeight: "600px",
              overflowY: "auto",
            }}
          >
            {categories.length === 0 ? (
              <div
                style={{
                  padding: "30px",
                  textAlign: "center",
                  color: currentTheme.TEXT_MUTED,
                  fontSize: "14px",
                }}
              >
                No categories yet
              </div>
            ) : (
              categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.categoryName)} 
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 20px",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                    backgroundColor: cat.categoryName === selectedCategory ? currentTheme.SIDEBAR_HOVER : currentTheme.CARD_BG,
                    borderBottom:
                      idx !== categories.length - 1
                        ? `1px solid ${currentTheme.SIDEBAR_HOVER}`
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (cat.categoryName !== selectedCategory) {
                        e.currentTarget.style.backgroundColor = currentTheme.SIDEBAR_HOVER;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (cat.categoryName !== selectedCategory) {
                        e.currentTarget.style.backgroundColor = currentTheme.CARD_BG;
                    }
                  }}
                >
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "600",
                      color: currentTheme.TEXT_PRIMARY,
                      margin: 0,
                    }}
                  >
                    {cat.categoryName}{" "}
                    <span
                      style={{ color: currentTheme.TEXT_MUTED, fontWeight: "400" }}
                    >
                      ({cat.categoryId})
                    </span>
                  </p>

                  <button
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleDeleteCategory(cat.id, cat.categoryName);
                    }}
                    style={{
                      background: `${currentTheme.PRIMARY}20`,
                      color: currentTheme.PRIMARY,
                      padding: "8px 16px",
                      border: `1px solid ${currentTheme.PRIMARY}40`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
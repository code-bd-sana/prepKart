// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { use } from "react";
// import { useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import {
//   Edit2,
//   ShoppingCart,
//   Check,
//   Printer,
//   ArrowLeft,
//   Share2,
//   Plus,
//   Minus,
//   Trash2,
//   Save,
//   ChevronDown,
//   ChevronUp,
//   X,
//   Bookmark,
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useTranslations } from "next-intl";
// import Link from "next/link";

// // Aisle order for sorting
// const aisleOrder = [
//   "Produce",
//   "Proteins",
//   "Dairy",
//   "Pantry",
//   "Snacks",
//   "Bakery",
//   "Frozen",
//   "Spices",
//   "Beverages",
//   "Other",
// ];

// export default function GroceryListPage({ params }) {
//   const unwrappedParams = use(params);
//   const { id } = unwrappedParams;
//   const locale = unwrappedParams.locale;
//   const t = useTranslations("register");
//   const { user } = useSelector((state) => state.auth);
//   const router = useRouter();

//   const getAuthToken = () => {
//     const token =
//       localStorage.getItem("token") || localStorage.getItem("accessToken");
//     return token || "";
//   };

//   const fetchWithAuth = async (url, options = {}) => {
//     const token = getAuthToken();
//     const headers = {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//       ...options.headers,
//     };

//     return fetch(url, { ...options, headers });
//   };

//   const [groceryList, setGroceryList] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [hidePantry, setHidePantry] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [newItem, setNewItem] = useState({
//     name: "",
//     quantity: 1,
//     unit: "unit",
//     aisle: "Other",
//   });
//   const [userPantry, setUserPantry] = useState([]);
//   const [expandedAisles, setExpandedAisles] = useState({});
//   const [isAllSelected, setIsAllSelected] = useState(false);
//   // for pantry modal
//   const [showPantryModal, setShowPantryModal] = useState(false);

//   useEffect(() => {
//     // Only check authentication AFTER Redux has had time to load
//     const timer = setTimeout(() => {
//       if (!user) {
//         // Check localStorage first (might have token)
//         const token =
//           localStorage.getItem("token") || localStorage.getItem("accessToken");

//         if (!token) {
//           router.push(`/${locale}/login`);
//         }
//         // If token exists, user might still be loading from Redux
//       }
//     }, 500); // Wait 500ms for Redux to load

//     return () => clearTimeout(timer);
//   }, [user, locale, router]);

//   useEffect(() => {
//     if (groceryList) {
//       // console.log("GROCERY LIST DEBUG:", {
//       //   id: groceryList._id,
//       //   title: groceryList.title,
//       //   instacartLink: groceryList.instacartDeepLink,
//       //   hasLink: !!groceryList.instacartDeepLink,
//       //   itemsCount: groceryList.items?.length,
//       //   checkedItems: groceryList.items?.filter((i) => i.checked).length,
//       // });
//     }
//   }, [groceryList]);

// const handleInstacartOrder = async () => {
//   if (!groceryList) {
//     toast.error("Grocery list not loaded");
//     return;
//   }

//   // Get checked items WITH PROPER FORMAT
//   const checkedItems = groceryList.items
//     .filter((item) => item.checked)
//     .map(item => ({
//       name: item.name,
//       quantity: item.quantity || 1,
//       unit: item.unit || 'unit',
//       checked: true  // Explicitly set
//     }));

//   if (checkedItems.length === 0) {
//     toast.info("Please select items to order");
//     return;
//   }

//   console.log("=== CREATING INSTACART SHOPPING LIST ===");
//   console.log("Selected items:", checkedItems);

//   try {
//     toast.loading("Creating Instacart shopping list...");
//     const userId = user?._id || user?.id || "anonymous";

//     // Call the REAL Instacart API
//     const response = await fetch("/api/instacart", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         groceryItems: checkedItems,  // Send objects, not strings
//         userId: userId,
//         groceryListId: groceryList._id,
//         source: "grocery_list_page" 
//       }),
//     });

//     // Check response status
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(`API Error: ${errorData.error || response.status}`);
//     }

//     const data = await response.json();
//     toast.dismiss();
    
//     if (data.success) {
//       const instacartUrl = data.url;
//       const shoppingListId = data.shopping_list_id;
      
//       console.log("INSTACART SHOPPING LIST CREATED!");
//       console.log("Shopping List ID:", shoppingListId);
//       console.log("Instacart URL:", instacartUrl);
      
//       toast.success(
//         <div className="max-w-md">
//           <div className="font-bold text-green-700 mb-2">
//             Instacart Shopping List Created
//           </div>
//           <div className="text-xs bg-green-50 p-2 rounded break-all mb-2">
//             {instacartUrl}
//           </div>
//           <div className="text-xs text-gray-600">
//             Opening shopping list...
//           </div>
//         </div>,
//         { autoClose: 5000 }
//       );
      
//       setTimeout(() => {
//         window.open(instacartUrl, "_blank", "noopener,noreferrer");
//       }, 1000);
      
//     } else {
//       toast.error(`Failed: ${data.error || "Unknown error"}`);
//     }
    
//   } catch (error) {
//     console.error("Instacart error:", error);
//     toast.dismiss();
//     toast.error(`Error: ${error.message}`);
//   }
// };

// const categorizeItem = (itemName) => {
//     const name = itemName.toLowerCase();

//     if (name.includes("sausage")) return "Meat";
//     if (name.includes("ricotta")) return "Dairy";
//     if (
//       name.includes("salt") ||
//       name.includes("oregano") ||
//       name.includes("nutmeg") ||
//       name.includes("seasoning")
//     )
//       return "Spices";
//     if (
//       name.includes("honey") ||
//       name.includes("broth") ||
//       name.includes("flour") ||
//       name.includes("lasagna") ||
//       name.includes("noodle")
//     )
//       return "Pantry";
//     if (
//       name.includes("garlic") ||
//       name.includes("broccolini") ||
//       name.includes("basil") ||
//       name.includes("parsley")
//     )
//       return "Produce";
//     // if (name.includes("oil")) return "Pantry";

//     return "Other";
//   };
//   // Initialize all aisles as expanded by default
//   useEffect(() => {
//     const initialExpanded = {};
//     aisleOrder.forEach((aisle) => {
//       initialExpanded[aisle] = true;
//     });

//     if (groceryList?.items) {
//       groceryList.items.forEach((item) => {
//         const aisle = item.aisle || item.category || "Other";
//         if (!initialExpanded.hasOwnProperty(aisle)) {
//           initialExpanded[aisle] = true;
//         }
//       });
//     }

//     setExpandedAisles(initialExpanded);
//   }, [groceryList]);

//   const toggleAisle = (aisle) => {
//     setExpandedAisles((prev) => ({
//       ...prev,
//       [aisle]: !prev[aisle],
//     }));
//   };

//   // Calculate if all visible items are checked
//   useEffect(() => {
//     if (!groceryList?.items) return;

//     const visibleItems = hidePantry
//       ? groceryList.items.filter((item) => !item.inPantry)
//       : groceryList.items;

//     const allChecked =
//       visibleItems.length > 0 && visibleItems.every((item) => item.checked);
//     setIsAllSelected(allChecked);
//   }, [groceryList, hidePantry]);

//   const markPantryItems = useCallback(
//     async (groceryItems) => {
//       if (!user || user?.tier === "free") {
//         return groceryItems.map((item) => ({ ...item, inPantry: false }));
//       }

//       try {
//         const token = getAuthToken();
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};

//         const response = await fetch("/api/pantry", { headers });

//         if (response.ok) {
//           const pantryData = await response.json();
//           const pantryItems = pantryData.pantry?.items || [];

//           // Debug log to see what's in pantry
//           // console.log(
//           //   "Pantry items from API:",
//           //   pantryItems.map((p) => p.name)
//           // );
//           // console.log(
//           //   "Grocery items:",
//           //   groceryItems.map((g) => g.name)
//           // );

//           return groceryItems.map((item) => {
//             // Clean and normalize names for matching
//             const groceryName = (item.normalizedName || item.name)
//               .toLowerCase()
//               .trim();

//             // Find EXACT match or contains match (but more strict)
//             const pantryItem = pantryItems.find((pantryItem) => {
//               const pantryName = (pantryItem.normalizedName || pantryItem.name)
//                 .toLowerCase()
//                 .trim();

//               // First try exact match
//               if (groceryName === pantryName) return true;

//               // Check if grocery item contains pantry item name
//               if (groceryName.includes(pantryName)) return true;

//               // Check if pantry item contains grocery item name
//               if (pantryName.includes(groceryName)) return true;

//               // Check for common synonyms
//               const synonyms = {
//                 broccoli: [
//                   "broccoli florets",
//                   "fresh broccoli",
//                   "broccoli heads",
//                 ],
//                 rice: [
//                   "cooked rice",
//                   "white rice",
//                   "brown rice",
//                   "basmati rice",
//                 ],
//                 honey: ["raw honey", "organic honey"],
//                 water: ["drinking water", "bottled water", "mineral water"],
//                 oil: ["olive oil", "vegetable oil", "cooking oil"],
//                 salt: ["table salt", "sea salt", "kosher salt"],
//               };

//               // Check synonyms
//               if (synonyms[groceryName]) {
//                 return synonyms[groceryName].some(
//                   (synonym) =>
//                     pantryName.includes(synonym) || synonym.includes(pantryName)
//                 );
//               }

//               return false;
//             });

//             const inPantry = !!pantryItem;

//             // Debug log for matches
//             if (inPantry) {
//               // console.log(
//               //   `Matched "${item.name}" with pantry item "${pantryItem?.name}"`
//               // );
//             }

//             return {
//               ...item,
//               inPantry,
//               pantryQuantity: pantryItem?.quantity || null,
//               pantryUnit: pantryItem?.unit || null,
//             };
//           });
//         }
//       } catch (error) {
//         console.error("Error checking pantry:", error);
//       }

//       return groceryItems.map((item) => ({ ...item, inPantry: false }));
//     },
//     [user]
//   );

//   const toggleSelectAll = async () => {
//     if (!groceryList) return;

//     const visibleItems = hidePantry
//       ? groceryList.items.filter((item) => !item.inPantry)
//       : groceryList.items;

//     const shouldSelectAll = !isAllSelected;
//     const updatedItems = groceryList.items.map((item) => {
//       // Only update items that are currently visible
//       const isVisible = hidePantry ? !item.inPantry : true;
//       if (isVisible) {
//         return { ...item, checked: shouldSelectAll };
//       }
//       return item;
//     });

//     // Update local state
//     setGroceryList({
//       ...groceryList,
//       items: updatedItems,
//       checkedItems: updatedItems.filter((item) => item.checked).length,
//     });

//     // Save to database
//     try {
//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}`,
//         {
//           // FIX: Added const response
//           method: "PATCH",
//           body: JSON.stringify({
//             items: updatedItems,
//             checkedItems: updatedItems.filter((item) => item.checked).length,
//           }),
//         }
//       );

//       if (response.ok) {
//         // Now response is defined
//         const data = await response.json();
//         if (data.success) {
//           const updatedList = data.groceryList;
//           const checkedItems = updatedList.items.filter((item) => item.checked);
//           const checkedCount = checkedItems.length;

//           // ===== Save to localStorage =====
//           if (checkedCount > 0) {
//             const cartData = {
//               checkedCount: checkedCount,
//               listId: updatedList._id,
//               instacartLink: updatedList.instacartDeepLink,
//               timestamp: Date.now(),
//               items: checkedItems,
//             };
//             localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
//           } else {
//             localStorage.removeItem("prepcart_cart");
//           }
//           // ===== END ADD =====
//         }
//       }
//     } catch (error) {
//       toast.error("Failed to update selection");
//     }
//   };

//   // Fetch grocery list
//   const fetchGroceryList = useCallback(
//     async (listId) => {
//       try {
//         setLoading(true);
//         const token = getAuthToken();
//         const headers = token ? { Authorization: `Bearer ${token}` } : {};

//         const response = await fetch(`/api/groceryLists/${listId}`, {
//           headers,
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to load: ${response.status}`);
//         }

//         const data = await response.json();

//         if (data.success) {
//           const list = data.groceryList;

//           // Mark items that are in pantry
//           const itemsWithPantryStatus = await markPantryItems(list.items);
//           setGroceryList({
//             ...list,
//             items: itemsWithPantryStatus,
//           });
//         } else {
//           toast.error(data.error || "Failed to load");
//         }
//       } catch (error) {
//         console.error("Error:", error);
//         toast.error("Error loading: " + error.message);
//       } finally {
//         setLoading(false);
//       }
//     },
//     [markPantryItems]
//   );
//   // Function to refresh pantry data
//   const refreshPantryData = useCallback(async () => {
//     if (!groceryList || !id) return;

//     try {
//       // console.log("Refreshing pantry data...");

//       // First, refresh the entire grocery list
//       await fetchGroceryList(id);

//       // Also force a pantry check
//       const token = getAuthToken();
//       const headers = token ? { Authorization: `Bearer ${token}` } : {};

//       const pantryResponse = await fetch("/api/pantry", { headers });
//       if (pantryResponse.ok) {
//         const pantryData = await pantryResponse.json();
//         if (pantryData.success && pantryData.pantry?.items) {
//           // console.log(
//           //   "Pantry refreshed with",
//           //   pantryData.pantry.items.length,
//           //   "items"
//           // );
//         }
//       }
//     } catch (error) {
//       console.error("Error refreshing pantry data:", error);
//     }
//   }, [groceryList, id, fetchGroceryList]);

//   // Fetch user pantry
//   const fetchUserPantry = useCallback(async () => {
//     if (user?.tier === "free") return;

//     try {
//       // Move fetchWithAuth logic inline
//       const token = getAuthToken();
//       const headers = {
//         "Content-Type": "application/json",
//         ...(token && { Authorization: `Bearer ${token}` }),
//       };

//       const response = await fetch("/api/pantry", { headers });

//       if (response.status === 403) {
//         return;
//       }

//       if (response.ok) {
//         const data = await response.json();
//         setUserPantry(data.pantry?.items || []);

//         if (groceryList?.items) {
//           const updatedItems = await markPantryItems(groceryList.items);
//           setGroceryList({
//             ...groceryList,
//             items: updatedItems,
//           });
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching pantry:", error);
//     }
//   }, [user, groceryList, markPantryItems]);

//   useEffect(() => {
//     if (id) {
//       fetchGroceryList(id);
//     }
//   }, [id, fetchGroceryList]);

//   // Calculate grouped items
//   const getGroupedItems = useCallback(() => {
//     if (!groceryList?.items) return {};

//     const itemsToDisplay = hidePantry
//       ? groceryList.items.filter((item) => !item.inPantry)
//       : groceryList.items;

//     const itemsWithFixedAisles = itemsToDisplay.map((item) => ({
//       ...item,
//       displayAisle:
//         item.aisle === "Other" ? categorizeItem(item.name) : item.aisle,
//     }));

//     const grouped = {};
//     itemsWithFixedAisles.forEach((item) => {
//       const aisle = item.displayAisle || item.aisle || item.category || "Other";
//       if (!grouped[aisle]) {
//         grouped[aisle] = [];
//       }
//       grouped[aisle].push(item);
//     });

//     return grouped;
//   }, [groceryList, hidePantry]);

//   useEffect(() => {
//     if (groceryList) {
//       // Initialize cart data when list loads
//       const checkedItems = groceryList.items.filter((item) => item.checked);
//       const checkedCount = checkedItems.length;

//       if (checkedCount > 0) {
//         const cartData = {
//           checkedCount: checkedCount,
//           listId: groceryList._id,
//           instacartLink: groceryList.instacartDeepLink,
//           timestamp: Date.now(),
//           items: checkedItems,
//         };
//         localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
//       }
//     }
//   }, [groceryList]);

//   const groupedItems = getGroupedItems();

//   // Sort aisles according to aisleOrder
//   const sortedAisles = Object.keys(groupedItems).sort((a, b) => {
//     const indexA = aisleOrder.indexOf(a);
//     const indexB = aisleOrder.indexOf(b);
//     if (indexA === -1 && indexB === -1) return a.localeCompare(b);
//     if (indexA === -1) return 1;
//     if (indexB === -1) return -1;
//     return indexA - indexB;
//   });

//   // Calculate totals
//   const getProgressItems = useCallback(() => {
//     if (!groceryList?.items) return [];

//     return hidePantry
//       ? groceryList.items.filter((item) => !item.inPantry) // Only non-pantry items count
//       : groceryList.items; // All items count
//   }, [groceryList, hidePantry]);

//   // Use this for progress calculations
//   const progressItems = getProgressItems();
//   const visibleCheckedCount =
//     progressItems.filter((item) => item.checked).length || 0;
//   const visibleProgressItemsCount = progressItems.length || 0;
//   const pantryItemsCount =
//     groceryList?.items?.filter((item) => item.inPantry).length || 0;
//   const checkedItemsCount =
//     groceryList?.items?.filter((item) => item.checked).length || 0;

//   const estimatedTotal =
//     groceryList?.items?.reduce(
//       (sum, item) => sum + (item.estimatedPrice || 0),
//       0
//     ) || 0;

//   const updateCartData = (list, instacartLink = null) => {
//     const checkedItems = list.items.filter((item) => item.checked);
//     const checkedCount = checkedItems.length;

//     if (checkedCount > 0) {
//       const cartData = {
//         checkedCount: checkedCount,
//         listId: list._id,
//         instacartLink: instacartLink, // Save the generated link
//         timestamp: Date.now(),
//         items: checkedItems.map((item) => ({
//           name: item.name,
//           quantity: item.quantity,
//           unit: item.unit,
//         })),
//       };
//       localStorage.setItem("prepcart_cart", JSON.stringify(cartData));

//       window.dispatchEvent(
//         new StorageEvent("storage", {
//           key: "prepcart_cart",
//           newValue: JSON.stringify(cartData),
//         })
//       );
//     } else {
//       localStorage.removeItem("prepcart_cart");
//       window.dispatchEvent(
//         new StorageEvent("storage", {
//           key: "prepcart_cart",
//           newValue: null,
//         })
//       );
//     }
//   };
//   // toggleItemChecked function

//   const toggleItemChecked = async (itemId) => {
//     if (!groceryList) return;

//     const updatedItems = groceryList.items.map((item) =>
//       item._id === itemId ? { ...item, checked: !item.checked } : item
//     );

//     // Send ALL item properties, not just checked status
//     const itemsToSend = updatedItems.map((item) => ({
//       _id: item._id,
//       name: item.name,
//       quantity: item.quantity,
//       unit: item.unit,
//       aisle: item.aisle,
//       checked: item.checked,
//       // Include other fields that exist
//       ...(item.estimatedPrice && { estimatedPrice: item.estimatedPrice }),
//       ...(item.normalizedName && { normalizedName: item.normalizedName }),
//     }));

//     try {
//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}`,
//         {
//           method: "PATCH",
//           body: JSON.stringify({
//             items: itemsToSend, // Send ALL items with their IDs
//           }),
//         }
//       );

//       const data = await response.json();

//       if (data.success) {
//         const updatedList = data.groceryList;
//         setGroceryList(updatedList);
//         updateCartData(updatedList);
//         // ===== Save to localStorage =====
//         const checkedItems = updatedList.items.filter((item) => item.checked);
//         const checkedCount = checkedItems.length;

//         if (checkedCount > 0) {
//           // Save cart data to localStorage
//           const cartData = {
//             checkedCount: checkedCount,
//             listId: updatedList._id,
//             instacartLink: updatedList.instacartDeepLink, // Make sure this field exists
//             timestamp: Date.now(),
//             items: checkedItems, // Optional: store the actual items if needed
//           };
//           localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
//         } else {
//           // If no items checked, clear localStorage
//           localStorage.removeItem("prepcart_cart");
//         }
//       }
//     } catch (error) {
//       console.error("Update error:", error);
//     }
//   };
//   // updateQuantity function
//   const updateQuantity = async (itemId, newQuantity) => {
//     if (!groceryList || newQuantity < 0.1) return;

//     const updatedItems = groceryList.items.map((item) => {
//       if (item._id === itemId) {
//         const newPrice = calculateEstimatedPrice(
//           item.name,
//           parseFloat(newQuantity),
//           item.unit
//         );
//         return {
//           ...item,
//           quantity: parseFloat(newQuantity),
//           estimatedPrice: newPrice,
//         };
//       }
//       return item;
//     });

//     const updatedList = {
//       ...groceryList,
//       items: updatedItems,
//       estimatedTotal: updatedItems.reduce(
//         (sum, item) => sum + (item.estimatedPrice || 0),
//         0
//       ),
//     };

//     setGroceryList(updatedList);

//     // Save to database
//     try {
//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}`,
//         {
//           method: "PATCH",
//           body: JSON.stringify({
//             items: updatedItems,
//             estimatedTotal: updatedList.estimatedTotal,
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to save quantity");
//       }

//       const data = await response.json();
//       if (!data.success) {
//         toast.error("Failed to update quantity");
//       }
//     } catch (error) {
//       console.error("Update quantity error:", error);
//       toast.error("Failed to update quantity");
//     }
//   };

//   // removeItem function
//   const removeItem = async (itemId) => {
//     if (!groceryList) return;

//     if (!confirm("Remove this item from the list?")) return;

//     try {
//       // Get the item name for debugging
//       const itemToDelete = groceryList.items.find(
//         (item) => item._id === itemId
//       );
//       // console.log("Deleting item:", itemToDelete?.name, "with ID:", itemId);
//       // console.log("Before deletion:", groceryList.items.length, "items");

//       const updatedItems = groceryList.items.filter(
//         (item) => item._id !== itemId
//       );

//       // console.log("After deletion:", updatedItems.length, "items");
//       // console.log(
//       //   "Sending to server:",
//       //   JSON.stringify({
//       //     items: updatedItems,
//       //     totalItems: updatedItems.length,
//       //     checkedItems: updatedItems.filter((item) => item.checked).length,
//       //   })
//       // );
//       // Make a DELETE request to remove just this item
//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}/items/${itemId}`,
//         {
//           method: "DELETE",
//         }
//       );

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success) {
//           // Remove from local state
//           const updatedItems = groceryList.items.filter(
//             (item) => item._id !== itemId
//           );

//           setGroceryList({
//             ...groceryList,
//             items: updatedItems,
//             totalItems: updatedItems.length,
//             checkedItems: updatedItems.filter((item) => item.checked).length,
//           });
//           toast.success("Item removed!");
//         } else {
//           toast.error(data.error || "Failed to remove item");
//         }
//       } else {
//         // Fallback: Use PATCH if DELETE endpoint doesn't exist
//         // console.log("DELETE endpoint not found, using PATCH fallback...");
//         await removeItemFallback(itemId);
//       }
//     } catch (error) {
//       console.error("Remove item error:", error);
//       toast.error("Failed to remove item");
//     }
//   };

//   // Fallback function if DELETE endpoint doesn't exist
//   const removeItemFallback = async (itemId) => {
//     const updatedItems = groceryList.items.filter(
//       (item) => item._id !== itemId
//     );

//     const response = await fetchWithAuth(
//       `/api/groceryLists/${groceryList._id}`,
//       {
//         method: "PATCH",
//         body: JSON.stringify({
//           items: updatedItems,
//           totalItems: updatedItems.length,
//           checkedItems: updatedItems.filter((item) => item.checked).length,
//         }),
//       }
//     );

//     if (response.ok) {
//       const data = await response.json();
//       if (data.success) {
//         setGroceryList({
//           ...groceryList,
//           items: updatedItems,
//           totalItems: updatedItems.length,
//           checkedItems: updatedItems.filter((item) => item.checked).length,
//         });
//         toast.success("Item removed!");
//       } else {
//         toast.error(data.error || "Failed to remove item");
//       }
//     } else {
//       toast.error("Failed to remove item");
//     }
//   };
//   // addNewItem function
//   const addNewItem = async () => {
//     if (!newItem.name.trim() || !groceryList) {
//       toast.error("Please enter an item name");
//       return;
//     }

//     try {
//       const tempId = `temp_${Date.now()}_${Math.random()
//         .toString(36)
//         .substr(2, 9)}`;
//       const newItemObj = {
//         _id: tempId,
//         name: newItem.name,
//         quantity: newItem.quantity,
//         unit: newItem.unit,
//         aisle: newItem.aisle,
//         category: newItem.aisle,
//         checked: false,
//         inPantry: false,
//         estimatedPrice: calculateEstimatedPrice(
//           newItem.name,
//           newItem.quantity,
//           newItem.unit
//         ),
//         normalizedName: newItem.name.toLowerCase(),
//         recipeSources: [],
//         note: "",
//       };

//       // Create the updated items array
//       const updatedItems = [...groceryList.items, newItemObj];

//       // Calculate updated totals
//       const totalItems = updatedItems.length;
//       const checkedItems = updatedItems.filter((item) => item.checked).length;
//       const estimatedTotal = updatedItems.reduce(
//         (sum, item) => sum + (item.estimatedPrice || 0),
//         0
//       );

//       // Save to database FIRST
//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}`,
//         {
//           method: "PATCH",
//           body: JSON.stringify({
//             items: updatedItems,
//             totalItems,
//             checkedItems,
//             estimatedTotal,
//             updatedAt: new Date().toISOString(),
//           }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to save to server");
//       }

//       const data = await response.json();

//       if (data.success && data.groceryList) {
//         // Update local state only after successful save
//         setGroceryList(data.groceryList);
//         setNewItem({ name: "", quantity: 1, unit: "unit", aisle: "Other" });
//         toast.success("Item added!");
//       } else {
//         toast.error(data.error || "Failed to add item");
//       }
//     } catch (error) {
//       console.error("Add item error:", error);
//       toast.error("Failed to add item");
//     }
//   };
//   // price calculation
//   const calculateEstimatedPrice = (name, quantity, unit) => {
//     const itemName = name.toLowerCase();
//     let pricePerUnit = 0;

//     // More realistic Canadian prices
//     const priceMap = {
//       chicken: 12.99,
//       beef: 16.99,
//       pork: 11.99,
//       rice: 4.99,
//       pasta: 2.49,
//       tomato: 3.99,
//       onion: 2.49,
//       garlic: 1.99,
//       potato: 1.99,
//       carrot: 1.99,
//       broccoli: 3.99,
//       spinach: 4.99,
//       egg: 0.35,
//       milk: 1.5,
//       cheese: 22.47,
//       butter: 14.97,
//       oil: 9.99,
//       bread: 3.99,
//     };

//     for (const [key, price] of Object.entries(priceMap)) {
//       if (itemName.includes(key)) {
//         pricePerUnit = price;
//         break;
//       }
//     }

//     if (pricePerUnit === 0) {
//       if (
//         itemName.includes("meat") ||
//         itemName.includes("chicken") ||
//         itemName.includes("beef")
//       ) {
//         pricePerUnit = 12.99;
//       } else if (
//         itemName.includes("vegetable") ||
//         itemName.includes("produce")
//       ) {
//         pricePerUnit = 3.99;
//       } else if (itemName.includes("dairy")) {
//         pricePerUnit = 5.99;
//       } else {
//         pricePerUnit = 2.99;
//       }
//     }

//     let estimated = pricePerUnit;

//     // Adjust for different units
//     if (unit === "kg" || unit === "kilogram") {
//       estimated = pricePerUnit * quantity;
//     } else if (unit === "g" || unit === "gram") {
//       estimated = (pricePerUnit / 1000) * quantity;
//     } else if (unit === "lb" || unit === "pound") {
//       estimated = pricePerUnit * quantity * 0.453592;
//     } else if (unit === "cup") {
//       estimated = pricePerUnit * quantity * 0.25;
//     } else if (unit === "ml" || unit === "milliliter") {
//       estimated = (pricePerUnit / 1000) * quantity;
//     } else if (unit === "l" || unit === "liter") {
//       estimated = pricePerUnit * quantity;
//     } else {
//       estimated = pricePerUnit * quantity;
//     }

//     return parseFloat(estimated.toFixed(2));
//   };

//   // printList function
//   const printList = () => {
//     window.print();
//   };
//   // shareList function
//   const shareList = async () => {
//     try {
//       if (navigator.share) {
//         await navigator.share({
//           title: groceryList?.title || "Grocery List",
//           text: `Check out my grocery list from Prepcart`,
//           url: window.location.href,
//         });
//       } else {
//         await navigator.clipboard.writeText(window.location.href);
//         toast.success("Link copied to clipboard!");
//       }
//     } catch (error) {
//       console.error("Share error:", error);
//     }
//   };

//   // saveChanges function
//   const saveChanges = async (itemsToSaveParam = null) => {
//     if (!groceryList) return;

//     try {
//       const itemsToSave = itemsToSaveParam || groceryList.items;

//       // console.log("Saving changes for", itemsToSave.length, "items");

//       // Prepare items with all necessary fields
//       const processedItems = itemsToSave.map((item) => ({
//         _id:
//           item._id ||
//           `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         name: item.name,
//         quantity: item.quantity || 1,
//         unit: item.unit || "unit",
//         aisle: item.aisle || item.category || "Other",
//         category: item.category || item.aisle || "Other",
//         checked: item.checked || false,
//         inPantry: item.inPantry || false,
//         estimatedPrice:
//           item.estimatedPrice ||
//           calculateEstimatedPrice(
//             item.name,
//             item.quantity || 1,
//             item.unit || "unit"
//           ),
//         normalizedName: item.normalizedName || item.name.toLowerCase(),
//         recipeSources: item.recipeSources || [],
//         note: item.note || "",
//       }));

//       const totalItems = processedItems.length;
//       const checkedItems = processedItems.filter((item) => item.checked).length;
//       const estimatedTotal = processedItems.reduce(
//         (sum, item) => sum + (item.estimatedPrice || 0),
//         0
//       );


//       const response = await fetchWithAuth(
//         `/api/groceryLists/${groceryList._id}`,
//         {
//           method: "PATCH",
//           body: JSON.stringify({
//             items: processedItems,
//             totalItems,
//             checkedItems,
//             estimatedTotal,
//             updatedAt: new Date().toISOString(),
//           }),
//         }
//       );

//       const responseText = await response.text();
//       // console.log("Server response:", responseText);

//       let data;
//       try {
//         data = JSON.parse(responseText);
//       } catch (e) {
//         console.error("Failed to parse server response:", e);
//         throw new Error("Invalid server response");
//       }

//       if (response.ok && data.success) {
//         // console.log("Save successful, updating local state");
//         // Update with the server's response
//         setGroceryList(data.groceryList);
//         setIsEditing(false);
//         toast.success("Changes saved!");

//         // Force a refresh to ensure consistency
//         setTimeout(() => {
//           fetchGroceryList(id);
//         }, 500);

//         return true;
//       } else {
//         console.error("Save failed:", data.error);
//         toast.error(data.error || "Failed to save changes");
//         return false;
//       }
//     } catch (error) {
//       console.error("Save error:", error);
//       toast.error("Failed to save changes: " + error.message);
//       return false;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading your grocery list...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!groceryList) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-4xl mb-4">🛒</div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">
//             Grocery List Not Found
//           </h2>
//           <button
//             onClick={() => router.push("/dashboard")}
//             className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
//           >
//             Back to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <section>
//       {/* <Navbar /> */}
//       <div className="container mx-auto px-4 max-w-[1200px] py-8 md:py-16 min-h-screen">
//         {/* Header with back button */}
//         <div className="mb-8">
//           <Link
//             href={`/${locale}`}
//             className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
//           >
//             <ArrowLeft />
//             {t("backToHome")}
//           </Link>
//         </div>

//         <div className="rounded-xl mx-auto max-w-[1200px] bg-white shadow-lg">
//           {/* Card Header */}
//           <div className="p-6 px-4 border-b border-gray-200">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//               <div className="flex-1">
//                 <h1 className="text-2xl font-semibold text-gray-900">
//                   {groceryList.title}
//                 </h1>
//                 <div className="flex flex-wrap gap-4 mt-2 text-gray-600 text-sm">
//                   <span>{visibleProgressItemsCount} items to buy</span>
//                   {pantryItemsCount > 0 && (
//                     <>
//                       <span>•</span>
//                       <span className="text-[#4a9fd8]">
//                         {pantryItemsCount} in pantry
//                       </span>
//                     </>
//                   )}

//                   {/* estimated price */}
//                   {/* <span>•</span>
//                   <span className="font-semibold text-green-600">
//                     Estimated: ${estimatedTotal.toFixed(2)}
//                   </span> */}
//                 </div>
//               </div>

//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={() => setShowPantryModal(true)}
//                   className="h-9 px-4 rounded-lg bg-[#4a9fd8] hover:bg-[#3b8ec4] transition-colors text-sm font-medium text-white flex items-center gap-2"
//                 >
//                   <Bookmark className="h-4 w-4" />
//                   Pantry
//                 </button>
//                 <button
//                   onClick={() => {
//                     if (isEditing) {
//                       // Call saveChanges directly
//                       saveChanges();
//                     } else {
//                       setIsEditing(!isEditing);
//                     }
//                   }}
//                   className="h-9 px-4 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2 border border-gray-300"
//                 >
//                   {isEditing ? (
//                     <>
//                       <Save className="h-4 w-4" />
//                       Save Changes
//                     </>
//                   ) : (
//                     <>
//                       <Edit2 className="h-4 w-4" />
//                       Edit List
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={toggleSelectAll}
//                   className="h-9 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
//                 >
//                   <Check className="h-4 w-4" />
//                   {isAllSelected ? "Deselect All" : "Select All"}
//                 </button>

//                 {user?.tier !== "free" && (
//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       role="switch"
//                       aria-checked={hidePantry}
//                       onClick={() => setHidePantry(!hidePantry)}
//                       className={`
//                         relative inline-flex h-6 w-11 items-center rounded-full transition-colors
//                         ${hidePantry ? "bg-teal-600" : "bg-gray-200"}
//                         focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
//                       `}
//                     >
//                       <span
//                         className={`
//                           inline-block h-4 w-4 transform rounded-full bg-white transition-transform
//                           ${hidePantry ? "translate-x-6" : "translate-x-1"}
//                         `}
//                       />
//                     </button>
//                     <span className="text-sm text-gray-600">
//                       Hide pantry items
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Progress */}
//             <div className="mt-6">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-sm font-medium text-gray-700">
//                   {visibleCheckedCount} of {visibleProgressItemsCount} items
//                   checked
//                 </span>
//                 <span className="text-sm text-gray-500">
//                   {Math.round(
//                     (visibleCheckedCount / visibleProgressItemsCount) * 100
//                   ) || 0}
//                   %
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
//                   style={{
//                     width: `${
//                       visibleProgressItemsCount > 0
//                         ? (visibleCheckedCount / visibleProgressItemsCount) *
//                           100
//                         : 0
//                     }%`,
//                   }}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Add Item Form (when editing) */}
//           {isEditing && (
//             <div className="p-6 border-b border-gray-200 bg-gray-50">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Add New Item
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Item Name *
//                   </label>
//                   <input
//                     type="text"
//                     value={newItem.name}
//                     onChange={(e) =>
//                       setNewItem({ ...newItem, name: e.target.value })
//                     }
//                     placeholder="e.g., Apples, Bread, Milk"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Quantity
//                   </label>
//                   <input
//                     type="number"
//                     min="0.1"
//                     step="0.1"
//                     value={newItem.quantity}
//                     onChange={(e) =>
//                       setNewItem({
//                         ...newItem,
//                         quantity: parseFloat(e.target.value) || 1,
//                       })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Unit
//                   </label>
//                   <select
//                     value={newItem.unit}
//                     onChange={(e) =>
//                       setNewItem({ ...newItem, unit: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                   >
//                     <option value="unit">unit</option>
//                     <option value="kg">kg</option>
//                     <option value="g">g</option>
//                     <option value="lb">lb</option>
//                     <option value="cup">cup</option>
//                     <option value="tbsp">tbsp</option>
//                     <option value="tsp">tsp</option>
//                     <option value="ml">ml</option>
//                     <option value="l">l</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Aisle
//                   </label>
//                   <select
//                     value={newItem.aisle}
//                     onChange={(e) =>
//                       setNewItem({ ...newItem, aisle: e.target.value })
//                     }
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                   >
//                     {aisleOrder.map((aisle) => (
//                       <option key={aisle} value={aisle}>
//                         {aisle}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="flex items-end">
//                   <button
//                     onClick={addNewItem}
//                     className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center"
//                   >
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Item
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Grocery Items */}
//           <div className="p-4">
//             {sortedAisles.length === 0 ? (
//               <div className="p-8 text-center">
//                 <div className="text-4xl mb-4">🛒</div>
//                 <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                   {hidePantry && pantryItemsCount > 0
//                     ? "All items are in your pantry!"
//                     : "Your grocery list is empty"}
//                 </h3>
//                 <p className="text-gray-600">
//                   {hidePantry && pantryItemsCount > 0
//                     ? "Toggle off 'Hide pantry items' to see all items"
//                     : "Add items to get started"}
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <div
//                   className={`
//                     grid gap-4
//                     ${
//                       sortedAisles.length === 1
//                         ? "grid-cols-1"
//                         : sortedAisles.length === 2
//                         ? "grid-cols-1 md:grid-cols-2"
//                         : "grid-cols-1 md:grid-cols-2"
//                     }
//                   `}
//                 >
//                   {sortedAisles.map((aisle) => (
//                     <div
//                       key={aisle}
//                       className="border border-gray-200 rounded-lg overflow-hidden"
//                     >
//                       <button
//                         onClick={() => toggleAisle(aisle)}
//                         className="w-full bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
//                       >
//                         <div className="flex items-center gap-3">
//                           {expandedAisles[aisle] ? (
//                             <ChevronUp className="h-4 w-4 text-gray-500" />
//                           ) : (
//                             <ChevronDown className="h-4 w-4 text-gray-500" />
//                           )}
//                           <h3 className="font-semibold text-[#568515]">
//                             {aisle}
//                           </h3>
//                         </div>
//                         <div className="flex items-center gap-4">
//                           {/* estimated price */}
//                           {/* <span className="text-sm text-gray-600">
//                             $
//                             {groupedItems[aisle]
//                               .reduce(
//                                 (sum, item) => sum + (item.estimatedPrice || 0),
//                                 0
//                               )
//                               .toFixed(2)}
//                           </span> */}
//                           <span className="text-sm text-gray-600">
//                             ({groupedItems[aisle].length} items)
//                           </span>
//                         </div>
//                       </button>

//                       {expandedAisles[aisle] && (
//                         <div className="divide-y divide-gray-100">
//                           {groupedItems[aisle].map((item) => (
//                             <div
//                               key={item._id}
//                               className={`px-4 py-3 flex items-center gap-4 ${
//                                 item.checked ? "bg-green-50" : ""
//                               }`}
//                             >
//                               <button
//                                 onClick={() => toggleItemChecked(item._id)}
//                                 className={`
//                                   h-5 w-5 rounded border flex items-center justify-center shrink-0
//                                   transition-colors
//                                   ${
//                                     item.checked
//                                       ? "bg-green-500 border-green-500"
//                                       : "border-gray-300 hover:border-gray-400"
//                                   }
//                                 `}
//                               >
//                                 {item.checked && (
//                                   <Check className="h-3 w-3 text-white" />
//                                 )}
//                               </button>

//                               <div className=" flex-1 flex items-center">
//                                 <span
//                                   className={`font-medium ${
//                                     item.checked
//                                       ? "text-green-700"
//                                       : "text-gray-900"
//                                   }`}
//                                 >
//                                   {item.name}
//                                 </span>
//                                 {item.inPantry && !hidePantry && (
//                                   <span className="ml-2 inline-flex items-center rounded-full border border-[#4a9fd8] px-2 py-0.5 text-xs font-medium text-[#4a9fd8]">
//                                     In Pantry
//                                   </span>
//                                 )}
//                               </div>
//                               {/* estimated price */}
//                               {/* <span className="text-gray-600 text-sm font-medium min-w-[60px] text-right">
//                                 ${(item.estimatedPrice || 0).toFixed(2)}
//                               </span> */}
//                               {isEditing ? (
//                                 <div className="flex items-center gap-2">
//                                   <button
//                                     onClick={() =>
//                                       updateQuantity(
//                                         item._id,
//                                         item.quantity - 0.5
//                                       )
//                                     }
//                                     className="h-6 w-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
//                                   >
//                                     <Minus className="h-3 w-3" />
//                                   </button>
//                                   <input
//                                     type="number"
//                                     min="0.1"
//                                     step="0.1"
//                                     value={item.quantity}
//                                     onChange={(e) =>
//                                       updateQuantity(
//                                         item._id,
//                                         parseFloat(e.target.value) || 0.1
//                                       )
//                                     }
//                                     className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
//                                   />
//                                   <button
//                                     onClick={() =>
//                                       updateQuantity(
//                                         item._id,
//                                         item.quantity + 0.5
//                                       )
//                                     }
//                                     className="h-6 w-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
//                                   >
//                                     <Plus className="h-3 w-3" />
//                                   </button>

//                                   <select
//                                     value={item.unit || "unit"}
//                                     onChange={(e) => {
//                                       const updatedItems =
//                                         groceryList.items.map((i) =>
//                                           i._id === item._id
//                                             ? { ...i, unit: e.target.value }
//                                             : i
//                                         );
//                                       setGroceryList({
//                                         ...groceryList,
//                                         items: updatedItems,
//                                       });
//                                       saveChanges(updatedItems);
//                                     }}
//                                     className="px-2 py-1 border border-gray-300 rounded text-sm"
//                                   >
//                                     <option value="unit">unit</option>
//                                     <option value="kg">kg</option>
//                                     <option value="g">g</option>
//                                     <option value="cup">cup</option>
//                                     <option value="tbsp">tbsp</option>
//                                   </select>

//                                   <button
//                                     onClick={() => removeItem(item._id)}
//                                     className="text-red-600 hover:text-red-800 ml-2"
//                                   >
//                                     <Trash2 className="h-4 w-4" />
//                                   </button>
//                                 </div>
//                               ) : (
//                                 <span className="text-gray-600 text-sm">
//                                   {item.quantity} {item.unit}
//                                 </span>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Bottom Section */}
//           <div className="p-6 border-t border-gray-200">
//             <div className="flex justify-between items-center">
//               <div className="text-sm text-gray-600">
//                 <p className="mt-1 p-3">
//                   Note: Prices and availability are provided by third-party
//                   services such as Instacart and may change at any time.
//                   Prepcart does not guarantee accuracy and is not responsible
//                   for price differences or availability.
//                 </p>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={printList}
//                   className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   <Printer className="h-4 w-4 mr-2" />
//                   Print
//                 </button>

//                 <button
//                   onClick={shareList}
//                   className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
//                 >
//                   <Share2 className="h-4 w-4 mr-2" />
//                   Share
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Instacart CTA */}
//         <div className="mt-8 bg-linear-to-r from-[#5a9e3a] to-[#4a9fd8] rounded-2xl p-8 text-center text-white">
//           <h3 className="text-2xl font-bold mb-3">Ready to shop?</h3>
//           <p className="mb-6 opacity-90">
//             Order all ingredients with one click on Instacart
//           </p>

//           {!user ? (
//             // Not logged in
//             <button
//               onClick={() => {
//                 toast.info("Please login to use Instacart");
//                 router.push(`/${locale}/login`);
//               }}
//               className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto"
//             >
//               <ShoppingCart className="h-5 w-5 mr-2" />
//               Login to Use Instacart
//             </button>
//           ) : visibleCheckedCount === 0 ? (
//             // No items selected
//             <button
//               onClick={() => {
//                 toast.info(
//                   "Please select at least one item to add to your Instacart cart"
//                 );
//               }}
//               className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto"
//             >
//               <ShoppingCart className="h-5 w-5 mr-2" />
//               Select Items First
//             </button>
//           ) : !groceryList?.instacartDeepLink ? (
//             // No Instacart link
//             <button
//               onClick={() => {
//                 toast.error(
//                   "Instacart link not available. Please try refreshing."
//                 );
//               }}
//               className="bg-gray-300 text-gray-500 py-3 px-8 rounded-lg font-bold flex items-center mx-auto cursor-not-allowed"
//               disabled
//             >
//               <ShoppingCart className="h-5 w-5 mr-2" />
//               Link Unavailable
//             </button>
//           ) : (
//             <button
//               onClick={handleInstacartOrder}
//               className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto cursor-pointer"
//             >
//               <ShoppingCart className="h-5 w-5 mr-2" />
//               Order {visibleCheckedCount} items on Instacart
//             </button>
//           )}
//         </div>
//       </div>
//       <PantryModal
//         isOpen={showPantryModal}
//         onClose={() => {
//           setShowPantryModal(false);
//           refreshPantryData();
//         }}
//         locale={locale}
//         user={user}
//         onUpdatePantry={refreshPantryData}
//       />
//     </section>
//   );
// }

// // Pantry Modal Component
// function PantryModal({
//   isOpen,
//   onClose,
//   locale,
//   user,
//   pantryItems = [],
//   onUpdatePantry,
// }) {
//   const modalRef = useRef(null);
//   const [pantry, setPantry] = useState(null);
//   const [pantryLoading, setPantryLoading] = useState(true);
//   const [newPantryItem, setNewPantryItem] = useState({
//     name: "",
//     quantity: 1,
//     unit: "unit",
//     category: "",
//   });
//   const router = useRouter();

//   // Fetch pantry when modal opens
//   useEffect(() => {
//     if (!isOpen || user?.tier === "free") return;

//     const fetchPantry = async () => {
//       if (!isOpen || user?.tier === "free") return;

//       try {
//         setPantryLoading(true);
//         const token =
//           localStorage.getItem("token") ||
//           localStorage.getItem("accessToken") ||
//           "";

//         const response = await fetch("/api/pantry", {
//           headers: {
//             "Content-Type": "application/json",
//             ...(token && { Authorization: `Bearer ${token}` }),
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
//           if (data.success) {
//             // Check for duplicates
//             const items = data.pantry.items || [];
//             const itemNames = items.map((item) => item.name.toLowerCase());
//             const duplicates = itemNames.filter(
//               (name, index) => itemNames.indexOf(name) !== index
//             );

//             if (duplicates.length > 0) {
//               console.warn("Duplicate pantry items found:", duplicates);
//             }

//             // console.log("Pantry item count:", items.length);
//             // console.log("Unique items:", [...new Set(itemNames)].length);

//             setPantry(data.pantry);
//           } else {
//             toast.error(data.error || "Failed to load pantry");
//           }
//         } else {
//           const errorData = await response.json();
//           if (response.status !== 403) {
//             toast.error(errorData.error || "Failed to load pantry");
//           }
//         }
//       } catch (error) {
//         console.error("Error fetching pantry:", error);
//         if (user?.tier !== "free") {
//           toast.error("Failed to load pantry");
//         }
//       } finally {
//         setPantryLoading(false);
//       }
//     };

//     fetchPantry();
//   }, [isOpen, user]);

//   const handleClickOutside = useCallback(
//     (e) => {
//       if (modalRef.current && !modalRef.current.contains(e.target)) {
//         onClose();
//       }
//     },
//     [onClose]
//   );

//   const addPantryItem = async () => {
//     if (!newPantryItem.name.trim()) {
//       toast.error("Please enter an item name");
//       return;
//     }

//     try {
//       const token =
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken") ||
//         "";
//       const response = await fetch("/api/pantry", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token && { Authorization: `Bearer ${token}` }),
//         },
//         body: JSON.stringify({
//           items: [newPantryItem],
//           action: "add",
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success) {
//           setPantry(data.pantry || data);
//           setNewPantryItem({
//             name: "",
//             quantity: 1,
//             unit: "unit",
//             category: "",
//           });
//           toast.success("Item added to pantry!");
//         } else {
//           toast.error(data.error || "Failed to add item");
//         }
//       } else {
//         const errorData = await response.json();
//         toast.error(errorData.error || "Failed to add item to pantry");
//       }
//     } catch (error) {
//       console.error("Error adding item:", error);
//       toast.error("Failed to add item to pantry");
//     }
//   };
//   const removePantryItem = async (itemName) => {
//     if (!confirm("Remove this item from pantry?")) return;

//     try {
//       const token =
//         localStorage.getItem("token") ||
//         localStorage.getItem("accessToken") ||
//         "";
//       const response = await fetch("/api/pantry", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           ...(token && { Authorization: `Bearer ${token}` }),
//         },
//         body: JSON.stringify({
//           items: [{ name: itemName }],
//           action: "remove",
//         }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success) {
//           setPantry(data.pantry || data);
//           toast.success("Item removed from pantry!");

//           // IMMEDIATELY refresh the grocery list after pantry change
//           if (onUpdatePantry) {
//             await onUpdatePantry();
//           }
//         } else {
//           toast.error(data.error || "Failed to remove item");
//         }
//       } else {
//         const errorData = await response.json();
//         toast.error(errorData.error || "Failed to remove item from pantry");
//       }
//     } catch (error) {
//       console.error("Error removing item:", error);
//       toast.error("Failed to remove item from pantry");
//     }
//   };
//   useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = "hidden";
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.body.style.overflow = "unset";
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.body.style.overflow = "unset";
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isOpen, handleClickOutside]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
//       {/* Overlay */}
//       <div className="absolute inset-0" onClick={onClose} />

//       {/* Modal Content */}
//       <div
//         ref={modalRef}
//         className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         {/* Header */}
//         <div className="bg-green-600 px-8 py-6 relative">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-white mb-1">My Pantry</h1>
//               <p className="text-white/90">
//                 Manage items you already have at home. These will be excluded
//                 from grocery lists when pantry toggle is enabled.
//               </p>
//             </div>

//             <button
//               onClick={onClose}
//               className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
//               aria-label="Close modal"
//             >
//               <X className="w-6 h-6" />
//             </button>
//           </div>
//         </div>

//         {/* Content Area */}
//         <div className="flex-1 overflow-y-auto p-8">
//           <div className="max-w-5xl mx-auto h-full">
//             {/* Upgrade message for free users */}
//             {user?.tier === "free" ? (
//               <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
//                 <h2 className="text-2xl font-semibold text-yellow-800 mb-3">
//                   Pantry Feature Unlocked
//                 </h2>
//                 <p className="text-yellow-700 mb-6 text-lg">
//                   The pantry feature is only available for Plus and Premium
//                   users.
//                 </p>
//                 <button
//                   onClick={() => {
//                     onClose();
//                     router.push(`/${locale}/#pricing`);
//                   }}
//                   className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-green-700 transition text-lg"
//                 >
//                   Upgrade Now
//                 </button>
//               </div>
//             ) : (
//               <>
//                 {/* Add Item Form */}
//                 <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
//                   <h2 className="text-2xl font-semibold text-gray-900 mb-6">
//                     Add New Item
//                   </h2>

//                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Item Name *
//                       </label>
//                       <input
//                         type="text"
//                         value={newPantryItem.name}
//                         onChange={(e) =>
//                           setNewPantryItem({
//                             ...newPantryItem,
//                             name: e.target.value,
//                           })
//                         }
//                         placeholder="e.g., Rice, Olive Oil, Eggs"
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Quantity
//                       </label>
//                       <input
//                         type="number"
//                         min="0.1"
//                         step="0.1"
//                         value={newPantryItem.quantity}
//                         onChange={(e) =>
//                           setNewPantryItem({
//                             ...newPantryItem,
//                             quantity: parseFloat(e.target.value) || 1,
//                           })
//                         }
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                       />
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Unit
//                       </label>
//                       <select
//                         value={newPantryItem.unit}
//                         onChange={(e) =>
//                           setNewPantryItem({
//                             ...newPantryItem,
//                             unit: e.target.value,
//                           })
//                         }
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//                       >
//                         <option value="unit">unit</option>
//                         <option value="cup">cup</option>
//                         <option value="tbsp">tbsp</option>
//                         <option value="tsp">tsp</option>
//                         <option value="oz">oz</option>
//                         <option value="lb">lb</option>
//                         <option value="kg">kg</option>
//                         <option value="g">g</option>
//                         <option value="ml">ml</option>
//                         <option value="l">l</option>
//                       </select>
//                     </div>

//                     <div className="flex items-end">
//                       <button
//                         onClick={addPantryItem}
//                         className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium text-lg"
//                       >
//                         Add to Pantry
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Pantry Items */}
//                 {pantryLoading ? (
//                   <div className="flex justify-center items-center h-64">
//                     <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
//                   </div>
//                 ) : pantry?.items && pantry.items.length > 0 ? (
//                   <div className="bg-white rounded-xl border border-gray-200 p-6">
//                     <div className="flex justify-between items-center mb-8">
//                       <h2 className="text-2xl font-semibold text-gray-900">
//                         Pantry Items ({pantry.items.length})
//                       </h2>
//                       <span className="text-sm text-gray-500">
//                         Last updated:{" "}
//                         {new Date(pantry.lastSynced).toLocaleDateString()}
//                       </span>
//                     </div>

//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                       {pantry.items.map((item, index) => (
//                         <div
//                           key={index}
//                           className="border border-gray-200 rounded-lg p-5 hover:border-green-300 hover:shadow-md transition-all"
//                         >
//                           <div className="flex justify-between items-start mb-3">
//                             <div>
//                               <h3 className="text-lg font-medium text-gray-900 mb-1">
//                                 {item.name}
//                               </h3>
//                               <p className="text-gray-600">
//                                 {item.quantity} {item.unit}
//                               </p>
//                             </div>
//                             <button
//                               onClick={() => removePantryItem(item.name)}
//                               className="text-red-600 hover:text-red-800 text-sm p-1"
//                             >
//                               <Trash2 className="h-5 w-5" />
//                             </button>
//                           </div>

//                           <div className="flex items-center justify-between text-sm">
//                             <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">
//                               {item.category || "Uncategorized"}
//                             </span>
//                             <span className="text-gray-500">
//                               {new Date(item.lastUpdated).toLocaleDateString()}
//                             </span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
//                     <div className="text-gray-400 text-8xl mb-6">🏪</div>
//                     <h3 className="text-2xl font-semibold text-gray-900 mb-3">
//                       Your pantry is empty
//                     </h3>
//                     <p className="text-gray-600 text-lg mb-8">
//                       Add items you already have at home to exclude them from
//                       grocery lists.
//                     </p>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { use } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Edit2,
  ShoppingCart,
  Check,
  Printer,
  ArrowLeft,
  Share2,
  Plus,
  Minus,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  X,
  Bookmark,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

// Aisle order for sorting
const aisleOrder = [
  "Produce",
  "Proteins",
  "Dairy",
  "Pantry",
  "Snacks",
  "Bakery",
  "Frozen",
  "Spices",
  "Beverages",
  "Other",
];

export default function GroceryListPage({ params }) {
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const locale = unwrappedParams.locale;
  const t = useTranslations("register");
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();

  // Performance optimizations
  const updateDebounceRef = useRef(null);
  const saveChangesDebounceRef = useRef(null);
  const pantryCheckTimeoutRef = useRef(null);
  const initialLoadRef = useRef(true);

  const getAuthToken = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    return token || "";
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    return fetch(url, { ...options, headers });
  };

  const [groceryList, setGroceryList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hidePantry, setHidePantry] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
    aisle: "Other",
  });
  const [userPantry, setUserPantry] = useState([]);
  const [expandedAisles, setExpandedAisles] = useState({});
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [showPantryModal, setShowPantryModal] = useState(false);

  // Authentication check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user) {
        const token = getAuthToken();
        if (!token) {
          router.push(`/${locale}/login`);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, locale, router]);

  // Initialize expanded aisles
  useEffect(() => {
    const initialExpanded = {};
    aisleOrder.forEach((aisle) => {
      initialExpanded[aisle] = true;
    });

    if (groceryList?.items) {
      groceryList.items.forEach((item) => {
        const aisle = item.aisle || item.category || "Other";
        if (!initialExpanded.hasOwnProperty(aisle)) {
          initialExpanded[aisle] = true;
        }
      });
    }

    setExpandedAisles(initialExpanded);
  }, [groceryList]);

  const toggleAisle = (aisle) => {
    setExpandedAisles((prev) => ({
      ...prev,
      [aisle]: !prev[aisle],
    }));
  };

  // Calculate if all visible items are checked
  useEffect(() => {
    if (!groceryList?.items) return;

    const visibleItems = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const allChecked =
      visibleItems.length > 0 && visibleItems.every((item) => item.checked);
    setIsAllSelected(allChecked);
  }, [groceryList, hidePantry]);

  // Optimized markPantryItems function
  const markPantryItems = useCallback(
    async (groceryItems) => {
      if (!user || user?.tier === "free") {
        return groceryItems.map((item) => ({ ...item, inPantry: false }));
      }

      try {
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch("/api/pantry", { headers });

        if (response.ok) {
          const pantryData = await response.json();
          const pantryItems = pantryData.pantry?.items || [];

          // Create a lookup map for faster matching
          const pantryMap = new Map();
          pantryItems.forEach((pantryItem) => {
            const pantryName = (pantryItem.normalizedName || pantryItem.name)
              .toLowerCase()
              .trim();
            pantryMap.set(pantryName, pantryItem);
          });

          return groceryItems.map((item) => {
            const groceryName = (item.normalizedName || item.name)
              .toLowerCase()
              .trim();

            // Check exact match first
            const pantryItem = pantryMap.get(groceryName);
            if (pantryItem) {
              return {
                ...item,
                inPantry: true,
                pantryQuantity: pantryItem.quantity || null,
                pantryUnit: pantryItem.unit || null,
              };
            }

            // Check for partial matches (only if needed)
            for (const [pantryName, pantryItem] of pantryMap.entries()) {
              if (
                groceryName.includes(pantryName) ||
                pantryName.includes(groceryName)
              ) {
                return {
                  ...item,
                  inPantry: true,
                  pantryQuantity: pantryItem.quantity || null,
                  pantryUnit: pantryItem.unit || null,
                };
              }
            }

            return { ...item, inPantry: false };
          });
        }
      } catch (error) {
        console.error("Error checking pantry:", error);
      }

      return groceryItems.map((item) => ({ ...item, inPantry: false }));
    },
    [user]
  );

  // Optimized toggleSelectAll with immediate UI feedback
  const toggleSelectAll = async () => {
    if (!groceryList) return;

    const visibleItems = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const shouldSelectAll = !isAllSelected;

    // Show loading toast
    // const toastId = toast.loading(
    //   shouldSelectAll ? "Selecting all items..." : "Deselecting all items..."
    // );

    try {
      // Update local state immediately for instant UI feedback
      setGroceryList((prev) => {
        const updatedItems = prev.items.map((item) => {
          const isVisible = hidePantry ? !item.inPantry : true;
          if (isVisible) {
            return { ...item, checked: shouldSelectAll };
          }
          return item;
        });

        // Update localStorage immediately
        const checkedItems = updatedItems.filter((item) => item.checked);
        if (checkedItems.length > 0) {
          const cartData = {
            checkedCount: checkedItems.length,
            listId: prev._id,
            instacartLink: prev.instacartDeepLink,
            timestamp: Date.now(),
            items: checkedItems,
          };
          localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
        } else {
          localStorage.removeItem("prepcart_cart");
        }

        return {
          ...prev,
          items: updatedItems,
          checkedItems: checkedItems.length,
        };
      });

      // Debounce API call
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }

      updateDebounceRef.current = setTimeout(async () => {
        try {
          const response = await fetchWithAuth(
            `/api/groceryLists/${groceryList._id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                items: groceryList.items.map((item) => ({
                  _id: item._id,
                  name: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  aisle: item.aisle,
                  checked: hidePantry && item.inPantry ? item.checked : shouldSelectAll,
                })),
                checkedItems: shouldSelectAll
                  ? groceryList.items.filter(
                      (item) => !(hidePantry && item.inPantry)
                    ).length
                  : 0,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              // toast.dismiss(toastId);
              // toast.success(
              //   shouldSelectAll ? "All items selected!" : "All items deselected!"
              // );
            }
          }
        } catch (error) {
          // toast.dismiss(toastId);
          toast.error("Failed to update selection");
        }
      }, 300); // Reduced debounce time
    } catch (error) {
      // toast.dismiss(toastId);
      toast.error("Failed to update selection");
    }
  };

  // Optimized fetchGroceryList
  const fetchGroceryList = useCallback(
    async (listId) => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(`/api/groceryLists/${listId}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to load: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          const list = data.groceryList;
          const itemsWithPantryStatus = await markPantryItems(list.items);
          setGroceryList({
            ...list,
            items: itemsWithPantryStatus,
          });

          // Update localStorage
          const checkedItems = itemsWithPantryStatus.filter(
            (item) => item.checked
          );
          if (checkedItems.length > 0) {
            const cartData = {
              checkedCount: checkedItems.length,
              listId: list._id,
              instacartLink: list.instacartDeepLink,
              timestamp: Date.now(),
              items: checkedItems,
            };
            localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
          }
        } else {
          toast.error(data.error || "Failed to load");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error loading: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [markPantryItems]
  );

  // Refresh pantry data
  const refreshPantryData = useCallback(async () => {
    if (!groceryList || !id) return;

    if (pantryCheckTimeoutRef.current) {
      clearTimeout(pantryCheckTimeoutRef.current);
    }

    pantryCheckTimeoutRef.current = setTimeout(async () => {
      try {
        await fetchGroceryList(id);
      } catch (error) {
        console.error("Error refreshing pantry data:", error);
      }
    }, 300);
  }, [groceryList, id, fetchGroceryList]);

  // Fetch user pantry
  const fetchUserPantry = useCallback(async () => {
    if (user?.tier === "free") return;

    try {
      const token = getAuthToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch("/api/pantry", { headers });

      if (response.status === 403) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUserPantry(data.pantry?.items || []);

        if (groceryList?.items) {
          const updatedItems = await markPantryItems(groceryList.items);
          setGroceryList({
            ...groceryList,
            items: updatedItems,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching pantry:", error);
    }
  }, [user, groceryList, markPantryItems]);

  // Initial fetch
  useEffect(() => {
    if (id && initialLoadRef.current) {
      initialLoadRef.current = false;
      fetchGroceryList(id);
    }
  }, [id, fetchGroceryList]);

  // Optimized getGroupedItems with memoization
  const getGroupedItems = useCallback(() => {
    if (!groceryList?.items) return {};

    const categorizeItem = (itemName) => {
      const name = itemName.toLowerCase();

      if (name.includes("sausage")) return "Meat";
      if (name.includes("ricotta")) return "Dairy";
      if (
        name.includes("salt") ||
        name.includes("oregano") ||
        name.includes("nutmeg") ||
        name.includes("seasoning")
      )
        return "Spices";
      if (
        name.includes("honey") ||
        name.includes("broth") ||
        name.includes("flour") ||
        name.includes("lasagna") ||
        name.includes("noodle")
      )
        return "Pantry";
      if (
        name.includes("garlic") ||
        name.includes("broccolini") ||
        name.includes("basil") ||
        name.includes("parsley")
      )
        return "Produce";
      return "Other";
    };

    const itemsToDisplay = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const grouped = {};
    itemsToDisplay.forEach((item) => {
      const aisle =
        item.aisle === "Other"
          ? categorizeItem(item.name)
          : item.aisle || item.category || "Other";
      if (!grouped[aisle]) {
        grouped[aisle] = [];
      }
      grouped[aisle].push(item);
    });

    return grouped;
  }, [groceryList, hidePantry]);

  const groupedItems = useMemo(() => getGroupedItems(), [getGroupedItems]);

  // Optimized sortedAisles with memoization
  const sortedAisles = useMemo(() => {
    return Object.keys(groupedItems).sort((a, b) => {
      const indexA = aisleOrder.indexOf(a);
      const indexB = aisleOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedItems]);

  // Calculate totals with memoization
  const {
    visibleCheckedCount,
    visibleProgressItemsCount,
    pantryItemsCount,
    checkedItemsCount,
    estimatedTotal,
  } = useMemo(() => {
    if (!groceryList?.items)
      return {
        visibleCheckedCount: 0,
        visibleProgressItemsCount: 0,
        pantryItemsCount: 0,
        checkedItemsCount: 0,
        estimatedTotal: 0,
      };

    const progressItems = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const visibleCheckedCount = progressItems.filter(
      (item) => item.checked
    ).length;
    const visibleProgressItemsCount = progressItems.length;
    const pantryItemsCount = groceryList.items.filter(
      (item) => item.inPantry
    ).length;
    const checkedItemsCount = groceryList.items.filter(
      (item) => item.checked
    ).length;

    const estimatedTotal =
      groceryList.items.reduce(
        (sum, item) => sum + (item.estimatedPrice || 0),
        0
      ) || 0;

    return {
      visibleCheckedCount,
      visibleProgressItemsCount,
      pantryItemsCount,
      checkedItemsCount,
      estimatedTotal,
    };
  }, [groceryList, hidePantry]);

  // Update cart data
  const updateCartData = useCallback(
    (list, instacartLink = null) => {
      const checkedItems = list.items.filter((item) => item.checked);
      const checkedCount = checkedItems.length;

      if (checkedCount > 0) {
        const cartData = {
          checkedCount: checkedCount,
          listId: list._id,
          instacartLink: instacartLink,
          timestamp: Date.now(),
          items: checkedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })),
        };
        localStorage.setItem("prepcart_cart", JSON.stringify(cartData));

        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "prepcart_cart",
            newValue: JSON.stringify(cartData),
          })
        );
      } else {
        localStorage.removeItem("prepcart_cart");
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "prepcart_cart",
            newValue: null,
          })
        );
      }
    },
    []
  );

  // Optimized toggleItemChecked with debounce and immediate feedback
  const toggleItemChecked = useCallback(
    async (itemId) => {
      if (!groceryList) return;

      // Show immediate toast
      // const toastId = toast.loading("Updating item...");

      // Update local state immediately
      const updatedItems = groceryList.items.map((item) =>
        item._id === itemId ? { ...item, checked: !item.checked } : item
      );

      setGroceryList((prev) => ({
        ...prev,
        items: updatedItems,
      }));

      // Update localStorage immediately
      const checkedItems = updatedItems.filter((item) => item.checked);
      const checkedCount = checkedItems.length;
      if (checkedCount > 0) {
        const cartData = {
          checkedCount: checkedCount,
          listId: groceryList._id,
          instacartLink: groceryList.instacartDeepLink,
          timestamp: Date.now(),
          items: checkedItems,
        };
        localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
      } else {
        localStorage.removeItem("prepcart_cart");
      }

      // Debounce API call
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }

      updateDebounceRef.current = setTimeout(async () => {
        try {
          const itemsToSend = updatedItems.map((item) => ({
            _id: item._id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            aisle: item.aisle,
            checked: item.checked,
            ...(item.estimatedPrice && { estimatedPrice: item.estimatedPrice }),
            ...(item.normalizedName && { normalizedName: item.normalizedName }),
          }));

          const response = await fetchWithAuth(
            `/api/groceryLists/${groceryList._id}`,
            {
              method: "PATCH",
              body: JSON.stringify({
                items: itemsToSend,
              }),
            }
          );

          const data = await response.json();

          if (data.success) {
            // toast.dismiss(toastId);
            // toast.success("Item updated!");
            updateCartData(data.groceryList);
          } else {
            // toast.dismiss(toastId);
            toast.error("Failed to update");
          }
        } catch (error) {
          console.error("Update error:", error);
          // toast.dismiss(toastId);
          toast.error("Update failed");
        }
      }, 300); // Reduced debounce time
    },
    [groceryList, fetchWithAuth, updateCartData]
  );

  // Optimized updateQuantity with immediate feedback
  const updateQuantity = async (itemId, newQuantity) => {
    if (!groceryList || newQuantity < 0.1) return;

    // const toastId = toast.loading("Updating quantity...");

    try {
      const updatedItems = groceryList.items.map((item) => {
        if (item._id === itemId) {
          const newPrice = calculateEstimatedPrice(
            item.name,
            parseFloat(newQuantity),
            item.unit
          );
          return {
            ...item,
            quantity: parseFloat(newQuantity),
            estimatedPrice: newPrice,
          };
        }
        return item;
      });

      // Update local state immediately
      setGroceryList({
        ...groceryList,
        items: updatedItems,
        estimatedTotal: updatedItems.reduce(
          (sum, item) => sum + (item.estimatedPrice || 0),
          0
        ),
      });

      // Debounce save
      if (saveChangesDebounceRef.current) {
        clearTimeout(saveChangesDebounceRef.current);
      }

      saveChangesDebounceRef.current = setTimeout(async () => {
        const response = await fetchWithAuth(
          `/api/groceryLists/${groceryList._id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              items: updatedItems,
              estimatedTotal: updatedItems.reduce(
                (sum, item) => sum + (item.estimatedPrice || 0),
                0
              ),
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // toast.dismiss(toastId);
            toast.success("Quantity updated!");
          } else {
            // toast.dismiss(toastId);
            toast.error("Failed to update quantity");
          }
        }
      }, 500);
    } catch (error) {
      console.error("Update quantity error:", error);
      // toast.dismiss(toastId);
      toast.error("Failed to update quantity");
    }
  };

  // Optimized removeItem
  const removeItem = async (itemId) => {
    if (!groceryList) return;

    if (!confirm("Remove this item from the list?")) return;

    const toastId = toast.loading("Removing item...");

    try {
      const itemToDelete = groceryList.items.find(
        (item) => item._id === itemId
      );

      // Update local state immediately
      const updatedItems = groceryList.items.filter(
        (item) => item._id !== itemId
      );

      setGroceryList({
        ...groceryList,
        items: updatedItems,
        totalItems: updatedItems.length,
        checkedItems: updatedItems.filter((item) => item.checked).length,
      });

      // Update localStorage
      const checkedItems = updatedItems.filter((item) => item.checked);
      if (checkedItems.length > 0) {
        const cartData = {
          checkedCount: checkedItems.length,
          listId: groceryList._id,
          instacartLink: groceryList.instacartDeepLink,
          timestamp: Date.now(),
          items: checkedItems,
        };
        localStorage.setItem("prepcart_cart", JSON.stringify(cartData));
      } else {
        localStorage.removeItem("prepcart_cart");
      }

      // Make DELETE request
      const response = await fetchWithAuth(
        `/api/groceryLists/${groceryList._id}/items/${itemId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.dismiss(toastId);
          toast.success("Item removed!");
        } else {
          toast.dismiss(toastId);
          toast.error(data.error || "Failed to remove item");
        }
      } else {
        // Fallback: Use PATCH
        await removeItemFallback(itemId);
        toast.dismiss(toastId);
        toast.success("Item removed!");
      }
    } catch (error) {
      console.error("Remove item error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to remove item");
    }
  };

  const removeItemFallback = async (itemId) => {
    const updatedItems = groceryList.items.filter(
      (item) => item._id !== itemId
    );

    const response = await fetchWithAuth(
      `/api/groceryLists/${groceryList._id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          items: updatedItems,
          totalItems: updatedItems.length,
          checkedItems: updatedItems.filter((item) => item.checked).length,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        setGroceryList({
          ...groceryList,
          items: updatedItems,
          totalItems: updatedItems.length,
          checkedItems: updatedItems.filter((item) => item.checked).length,
        });
      }
    }
  };

  // Optimized addNewItem
  const addNewItem = async () => {
    if (!newItem.name.trim() || !groceryList) {
      toast.error("Please enter an item name");
      return;
    }

    const toastId = toast.loading("Adding item...");

    try {
      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const newItemObj = {
        _id: tempId,
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
        aisle: newItem.aisle,
        category: newItem.aisle,
        checked: false,
        inPantry: false,
        estimatedPrice: calculateEstimatedPrice(
          newItem.name,
          newItem.quantity,
          newItem.unit
        ),
        normalizedName: newItem.name.toLowerCase(),
        recipeSources: [],
        note: "",
      };

      // Update local state immediately
      const updatedItems = [...groceryList.items, newItemObj];
      setGroceryList((prev) => ({
        ...prev,
        items: updatedItems,
        totalItems: updatedItems.length,
      }));

      setNewItem({ name: "", quantity: 1, unit: "unit", aisle: "Other" });

      // Save to database
      const response = await fetchWithAuth(
        `/api/groceryLists/${groceryList._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            items: updatedItems,
            totalItems: updatedItems.length,
            checkedItems: updatedItems.filter((item) => item.checked).length,
            estimatedTotal: updatedItems.reduce(
              (sum, item) => sum + (item.estimatedPrice || 0),
              0
            ),
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save to server");
      }

      const data = await response.json();

      if (data.success && data.groceryList) {
        toast.dismiss(toastId);
        toast.success("Item added!");
        setGroceryList(data.groceryList);
      } else {
        toast.dismiss(toastId);
        toast.error(data.error || "Failed to add item");
      }
    } catch (error) {
      console.error("Add item error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to add item");
    }
  };

  // Price calculation
  const calculateEstimatedPrice = (name, quantity, unit) => {
    const itemName = name.toLowerCase();
    let pricePerUnit = 0;

    const priceMap = {
      chicken: 12.99,
      beef: 16.99,
      pork: 11.99,
      rice: 4.99,
      pasta: 2.49,
      tomato: 3.99,
      onion: 2.49,
      garlic: 1.99,
      potato: 1.99,
      carrot: 1.99,
      broccoli: 3.99,
      spinach: 4.99,
      egg: 0.35,
      milk: 1.5,
      cheese: 22.47,
      butter: 14.97,
      oil: 9.99,
      bread: 3.99,
    };

    for (const [key, price] of Object.entries(priceMap)) {
      if (itemName.includes(key)) {
        pricePerUnit = price;
        break;
      }
    }

    if (pricePerUnit === 0) {
      if (
        itemName.includes("meat") ||
        itemName.includes("chicken") ||
        itemName.includes("beef")
      ) {
        pricePerUnit = 12.99;
      } else if (
        itemName.includes("vegetable") ||
        itemName.includes("produce")
      ) {
        pricePerUnit = 3.99;
      } else if (itemName.includes("dairy")) {
        pricePerUnit = 5.99;
      } else {
        pricePerUnit = 2.99;
      }
    }

    let estimated = pricePerUnit;

    if (unit === "kg" || unit === "kilogram") {
      estimated = pricePerUnit * quantity;
    } else if (unit === "g" || unit === "gram") {
      estimated = (pricePerUnit / 1000) * quantity;
    } else if (unit === "lb" || unit === "pound") {
      estimated = pricePerUnit * quantity * 0.453592;
    } else if (unit === "cup") {
      estimated = pricePerUnit * quantity * 0.25;
    } else if (unit === "ml" || unit === "milliliter") {
      estimated = (pricePerUnit / 1000) * quantity;
    } else if (unit === "l" || unit === "liter") {
      estimated = pricePerUnit * quantity;
    } else {
      estimated = pricePerUnit * quantity;
    }

    return parseFloat(estimated.toFixed(2));
  };

  // Print list
  const printList = () => {
    window.print();
  };

  // Share list
  const shareList = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: groceryList?.title || "Grocery List",
          text: `Check out my grocery list from Prepcart`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  // Save changes with debounce
  const saveChanges = async (itemsToSaveParam = null) => {
    if (!groceryList) return;

    const toastId = toast.loading("Saving changes...");

    try {
      const itemsToSave = itemsToSaveParam || groceryList.items;

      const processedItems = itemsToSave.map((item) => ({
        _id:
          item._id ||
          `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        aisle: item.aisle || item.category || "Other",
        category: item.category || item.aisle || "Other",
        checked: item.checked || false,
        inPantry: item.inPantry || false,
        estimatedPrice:
          item.estimatedPrice ||
          calculateEstimatedPrice(
            item.name,
            item.quantity || 1,
            item.unit || "unit"
          ),
        normalizedName: item.normalizedName || item.name.toLowerCase(),
        recipeSources: item.recipeSources || [],
        note: item.note || "",
      }));

      const totalItems = processedItems.length;
      const checkedItems = processedItems.filter((item) => item.checked).length;
      const estimatedTotal = processedItems.reduce(
        (sum, item) => sum + (item.estimatedPrice || 0),
        0
      );

      const response = await fetchWithAuth(
        `/api/groceryLists/${groceryList._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            items: processedItems,
            totalItems,
            checkedItems,
            estimatedTotal,
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse server response:", e);
        throw new Error("Invalid server response");
      }

      if (response.ok && data.success) {
        setGroceryList(data.groceryList);
        setIsEditing(false);
        toast.dismiss(toastId);
        toast.success("Changes saved!");

        setTimeout(() => {
          fetchGroceryList(id);
        }, 300);

        return true;
      } else {
        toast.dismiss(toastId);
        toast.error(data.error || "Failed to save changes");
        return false;
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.dismiss(toastId);
      toast.error("Failed to save changes: " + error.message);
      return false;
    }
  };

  // Optimized handleInstacartOrder with proper toast flow
  const handleInstacartOrder = async () => {
    if (!groceryList) {
      toast.error("Grocery list not loaded");
      return;
    }

    // Get checked items
    const checkedItems = groceryList.items
      .filter((item) => item.checked)
      .map((item) => ({
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || "unit",
        checked: true,
      }));

    if (checkedItems.length === 0) {
      toast.info("Please select items to order");
      return;
    }

    console.log("=== CREATING INSTACART SHOPPING LIST ===");
    console.log("Selected items:", checkedItems);

    // Show loading toast with details
    const toastId = toast.loading(
      <div className="max-w-md">
        <div className="font-bold text-green-700 mb-1">
          Creating Instacart Shopping List...
        </div>
        <div className="text-sm text-gray-600">
          Processing {checkedItems.length} selected items
        </div>
        <div className="text-xs text-gray-500 mt-1">
          This may take a few seconds
        </div>
      </div>,
      { autoClose: false }
    );

    try {
      const userId = user?._id || user?.id || "anonymous";

      const response = await fetch("/api/instacart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groceryItems: checkedItems,
          userId: userId,
          groceryListId: groceryList._id,
          source: "grocery_list_page",
          userTier: user?.tier || "free",
        }),
      });

      // Check response status
      if (!response.ok) {
        const errorData = await response.json();
        toast.dismiss(toastId);
        toast.error(`API Error: ${errorData.error || response.status}`);
        return;
      }

      const data = await response.json();
      toast.dismiss(toastId);

      if (data.success) {
        const instacartUrl = data.url;
        const shoppingListId = data.shopping_list_id;

        console.log("INSTACART SHOPPING LIST CREATED!");
        console.log("Shopping List ID:", shoppingListId);
        console.log("Instacart URL:", instacartUrl);

        // Show success toast
        toast.success(
          <div className="max-w-md">
            <div className="font-bold text-green-700 mb-2">
              Instacart Shopping List Created Successfully!
            </div>
            <div className="text-sm mb-2">
              Your shopping list with {checkedItems.length} items is ready
            </div>
            <div className="text-xs bg-green-50 p-2 rounded break-all mb-2">
              {instacartUrl}
            </div>
            <div className="text-xs text-gray-600">
              Opening shopping list in 2 seconds...
            </div>
          </div>,
          { autoClose: 5000 }
        );

        // Open in new tab after a short delay
        setTimeout(() => {
          window.open(instacartUrl, "_blank", "noopener,noreferrer");
        }, 2000);
      } else {
        toast.error(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Instacart error:", error);
      toast.dismiss(toastId);
      toast.error(`Error: ${error.message}`);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateDebounceRef.current) {
        clearTimeout(updateDebounceRef.current);
      }
      if (saveChangesDebounceRef.current) {
        clearTimeout(saveChangesDebounceRef.current);
      }
      if (pantryCheckTimeoutRef.current) {
        clearTimeout(pantryCheckTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your grocery list...</p>
        </div>
      </div>
    );
  }

  if (!groceryList) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Grocery List Not Found
          </h2>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="container mx-auto px-4 max-w-[1200px] py-8 md:py-16 min-h-screen">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition"
          >
            <ArrowLeft />
            {t("backToHome")}
          </Link>
        </div>

        <div className="rounded-xl mx-auto max-w-[1200px] bg-white shadow-lg">
          {/* Card Header */}
          <div className="p-6 px-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {groceryList.title}
                </h1>
                <div className="flex flex-wrap gap-4 mt-2 text-gray-600 text-sm">
                  <span>{visibleProgressItemsCount} items to buy</span>
                  {pantryItemsCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-[#4a9fd8]">
                        {pantryItemsCount} in pantry
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowPantryModal(true)}
                  className="h-9 px-4 rounded-lg bg-[#4a9fd8] hover:bg-[#3b8ec4] transition-colors text-sm font-medium text-white flex items-center gap-2"
                >
                  <Bookmark className="h-4 w-4" />
                  Pantry
                </button>
                <button
                  onClick={() => {
                    if (isEditing) {
                      saveChanges();
                    } else {
                      setIsEditing(!isEditing);
                    }
                  }}
                  className="h-9 px-4 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2 border border-gray-300"
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Edit List
                    </>
                  )}
                </button>
                <button
                  onClick={toggleSelectAll}
                  className="h-9 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {isAllSelected ? "Deselect All" : "Select All"}
                </button>

                {user?.tier !== "free" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hidePantry}
                      onClick={() => setHidePantry(!hidePantry)}
                      className={`
                        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                        ${hidePantry ? "bg-teal-600" : "bg-gray-200"}
                        focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                          ${hidePantry ? "translate-x-6" : "translate-x-1"}
                        `}
                      />
                    </button>
                    <span className="text-sm text-gray-600">
                      Hide pantry items
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {visibleCheckedCount} of {visibleProgressItemsCount} items
                  checked
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(
                    (visibleCheckedCount / visibleProgressItemsCount) * 100
                  ) || 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      visibleProgressItemsCount > 0
                        ? (visibleCheckedCount / visibleProgressItemsCount) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Add Item Form (when editing) */}
          {isEditing && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Item
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    placeholder="e.g., Apples, Bread, Milk"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        quantity: parseFloat(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unit: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="unit">unit</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tbsp</option>
                    <option value="tsp">tsp</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aisle
                  </label>
                  <select
                    value={newItem.aisle}
                    onChange={(e) =>
                      setNewItem({ ...newItem, aisle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {aisleOrder.map((aisle) => (
                      <option key={aisle} value={aisle}>
                        {aisle}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={addNewItem}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grocery Items */}
          <div className="p-4">
            {sortedAisles.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">🛒</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {hidePantry && pantryItemsCount > 0
                    ? "All items are in your pantry!"
                    : "Your grocery list is empty"}
                </h3>
                <p className="text-gray-600">
                  {hidePantry && pantryItemsCount > 0
                    ? "Toggle off 'Hide pantry items' to see all items"
                    : "Add items to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`
                    grid gap-4
                    ${
                      sortedAisles.length === 1
                        ? "grid-cols-1"
                        : sortedAisles.length === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : "grid-cols-1 md:grid-cols-2"
                    }
                  `}
                >
                  {sortedAisles.map((aisle) => (
                    <div
                      key={aisle}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleAisle(aisle)}
                        className="w-full bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {expandedAisles[aisle] ? (
                            <ChevronUp className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          )}
                          <h3 className="font-semibold text-[#568515]">
                            {aisle}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            ({groupedItems[aisle].length} items)
                          </span>
                        </div>
                      </button>

                      {expandedAisles[aisle] && (
                        <div className="divide-y divide-gray-100">
                          {groupedItems[aisle].map((item) => (
                            <div
                              key={item._id}
                              className={`px-4 py-3 flex items-center gap-4 ${
                                item.checked ? "bg-green-50" : ""
                              }`}
                            >
                              <button
                                onClick={() => toggleItemChecked(item._id)}
                                className={`
                                  h-5 w-5 rounded border flex items-center justify-center shrink-0
                                  transition-colors
                                  ${
                                    item.checked
                                      ? "bg-green-500 border-green-500"
                                      : "border-gray-300 hover:border-gray-400"
                                  }
                                `}
                              >
                                {item.checked && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </button>

                              <div className=" flex-1 flex items-center">
                                <span
                                  className={`font-medium ${
                                    item.checked
                                      ? "text-green-700"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.inPantry && !hidePantry && (
                                  <span className="ml-2 inline-flex items-center rounded-full border border-[#4a9fd8] px-2 py-0.5 text-xs font-medium text-[#4a9fd8]">
                                    In Pantry
                                  </span>
                                )}
                              </div>
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item._id,
                                        item.quantity - 0.5
                                      )
                                    }
                                    className="h-6 w-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      updateQuantity(
                                        item._id,
                                        parseFloat(e.target.value) || 0.1
                                      )
                                    }
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                  />
                                  <button
                                    onClick={() =>
                                      updateQuantity(
                                        item._id,
                                        item.quantity + 0.5
                                      )
                                    }
                                    className="h-6 w-6 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>

                                  <select
                                    value={item.unit || "unit"}
                                    onChange={(e) => {
                                      const updatedItems =
                                        groceryList.items.map((i) =>
                                          i._id === item._id
                                            ? { ...i, unit: e.target.value }
                                            : i
                                        );
                                      setGroceryList({
                                        ...groceryList,
                                        items: updatedItems,
                                      });
                                      saveChanges(updatedItems);
                                    }}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="unit">unit</option>
                                    <option value="kg">kg</option>
                                    <option value="g">g</option>
                                    <option value="cup">cup</option>
                                    <option value="tbsp">tbsp</option>
                                  </select>

                                  <button
                                    onClick={() => removeItem(item._id)}
                                    className="text-red-600 hover:text-red-800 ml-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-600 text-sm">
                                  {item.quantity} {item.unit}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p className="mt-1 p-3">
                  Note: Prices and availability are provided by third-party
                  services such as Instacart and may change at any time.
                  Prepcart does not guarantee accuracy and is not responsible
                  for price differences or availability.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={printList}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </button>

                <button
                  onClick={shareList}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instacart CTA */}
        <div className="mt-8 bg-linear-to-r from-[#5a9e3a] to-[#4a9fd8] rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Ready to shop?</h3>
          <p className="mb-6 opacity-90">
            Order all ingredients with one click on Instacart
          </p>

          {!user ? (
            <button
              onClick={() => {
                toast.info("Please login to use Instacart");
                router.push(`/${locale}/login`);
              }}
              className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Login to Use Instacart
            </button>
          ) : visibleCheckedCount === 0 ? (
            <button
              onClick={() => {
                toast.info(
                  "Please select at least one item to add to your Instacart cart"
                );
              }}
              className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Select Items First
            </button>
          ) : !groceryList?.instacartDeepLink ? (
            <button
              onClick={() => {
                toast.error(
                  "Instacart link not available. Please try refreshing."
                );
              }}
              className="bg-gray-300 text-gray-500 py-3 px-8 rounded-lg font-bold flex items-center mx-auto cursor-not-allowed"
              disabled
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Link Unavailable
            </button>
          ) : (
            <button
              onClick={handleInstacartOrder}
              className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order {visibleCheckedCount} items on Instacart
            </button>
          )}
        </div>
      </div>
      {/* Pantry Modal - Keep your existing PantryModal component */}
      <PantryModal
        isOpen={showPantryModal}
        onClose={() => {
          setShowPantryModal(false);
          refreshPantryData();
        }}
        locale={locale}
        user={user}
        onUpdatePantry={refreshPantryData}
      />
    </section>
  );
}
      

// Pantry Modal Component
function PantryModal({
  isOpen,
  onClose,
  locale,
  user,
  pantryItems = [],
  onUpdatePantry,
}) {
  const modalRef = useRef(null);
  const [pantry, setPantry] = useState(null);
  const [pantryLoading, setPantryLoading] = useState(true);
  const [newPantryItem, setNewPantryItem] = useState({
    name: "",
    quantity: 1,
    unit: "unit",
    category: "",
  });
  const router = useRouter();

  // Fetch pantry when modal opens
  useEffect(() => {
    if (!isOpen || user?.tier === "free") return;

    const fetchPantry = async () => {
      if (!isOpen || user?.tier === "free") return;

      try {
        setPantryLoading(true);
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          "";

        const response = await fetch("/api/pantry", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Check for duplicates
            const items = data.pantry.items || [];
            const itemNames = items.map((item) => item.name.toLowerCase());
            const duplicates = itemNames.filter(
              (name, index) => itemNames.indexOf(name) !== index
            );

            if (duplicates.length > 0) {
              console.warn("Duplicate pantry items found:", duplicates);
            }

            // console.log("Pantry item count:", items.length);
            // console.log("Unique items:", [...new Set(itemNames)].length);

            setPantry(data.pantry);
          } else {
            toast.error(data.error || "Failed to load pantry");
          }
        } else {
          const errorData = await response.json();
          if (response.status !== 403) {
            toast.error(errorData.error || "Failed to load pantry");
          }
        }
      } catch (error) {
        console.error("Error fetching pantry:", error);
        if (user?.tier !== "free") {
          toast.error("Failed to load pantry");
        }
      } finally {
        setPantryLoading(false);
      }
    };

    fetchPantry();
  }, [isOpen, user]);

  const handleClickOutside = useCallback(
    (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    },
    [onClose]
  );

  const addPantryItem = async () => {
    if (!newPantryItem.name.trim()) {
      toast.error("Please enter an item name");
      return;
    }

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";
      const response = await fetch("/api/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: [newPantryItem],
          action: "add",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPantry(data.pantry || data);
          setNewPantryItem({
            name: "",
            quantity: 1,
            unit: "unit",
            category: "",
          });
          toast.success("Item added to pantry!");
        } else {
          toast.error(data.error || "Failed to add item");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to add item to pantry");
      }
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Failed to add item to pantry");
    }
  };
  const removePantryItem = async (itemName) => {
    if (!confirm("Remove this item from pantry?")) return;

    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        "";
      const response = await fetch("/api/pantry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          items: [{ name: itemName }],
          action: "remove",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPantry(data.pantry || data);
          toast.success("Item removed from pantry!");

          // IMMEDIATELY refresh the grocery list after pantry change
          if (onUpdatePantry) {
            await onUpdatePantry();
          }
        } else {
          toast.error(data.error || "Failed to remove item");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to remove item from pantry");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item from pantry");
    }
  };
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="relative bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-green-600 px-8 py-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">My Pantry</h1>
              <p className="text-white/90">
                Manage items you already have at home. These will be excluded
                from grocery lists when pantry toggle is enabled.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto h-full">
            {/* Upgrade message for free users */}
            {user?.tier === "free" ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <h2 className="text-2xl font-semibold text-yellow-800 mb-3">
                  Pantry Feature Unlocked
                </h2>
                <p className="text-yellow-700 mb-6 text-lg">
                  The pantry feature is only available for Plus and Premium
                  users.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    router.push(`/${locale}/#pricing`);
                  }}
                  className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-green-700 transition text-lg"
                >
                  Upgrade Now
                </button>
              </div>
            ) : (
              <>
                {/* Add Item Form */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Add New Item
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        value={newPantryItem.name}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g., Rice, Olive Oil, Eggs"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={newPantryItem.quantity}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
                            quantity: parseFloat(e.target.value) || 1,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        value={newPantryItem.unit}
                        onChange={(e) =>
                          setNewPantryItem({
                            ...newPantryItem,
                            unit: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="unit">unit</option>
                        <option value="cup">cup</option>
                        <option value="tbsp">tbsp</option>
                        <option value="tsp">tsp</option>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="l">l</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={addPantryItem}
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium text-lg"
                      >
                        Add to Pantry
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pantry Items */}
                {pantryLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
                  </div>
                ) : pantry?.items && pantry.items.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-8">
                      <h2 className="text-2xl font-semibold text-gray-900">
                        Pantry Items ({pantry.items.length})
                      </h2>
                      <span className="text-sm text-gray-500">
                        Last updated:{" "}
                        {new Date(pantry.lastSynced).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {pantry.items.map((item, index) => (
                        <div
                          key={index}
                          className="border border-gray-200 rounded-lg p-5 hover:border-green-300 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {item.name}
                              </h3>
                              <p className="text-gray-600">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                            <button
                              onClick={() => removePantryItem(item.name)}
                              className="text-red-600 hover:text-red-800 text-sm p-1"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg">
                              {item.category || "Uncategorized"}
                            </span>
                            <span className="text-gray-500">
                              {new Date(item.lastUpdated).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-gray-400 text-8xl mb-6">🏪</div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      Your pantry is empty
                    </h3>
                    <p className="text-gray-600 text-lg mb-8">
                      Add items you already have at home to exclude them from
                      grocery lists.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

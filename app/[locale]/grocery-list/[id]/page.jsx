"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { 
  generateInstacartLink,
  trackInstacartClick,
  generateSimpleInstacartLink 
} from "@/lib/instacart";

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


  useEffect(() => {
    // Only check authentication AFTER Redux has had time to load
    const timer = setTimeout(() => {
      if (!user) {
        // Check localStorage first (might have token)
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");

        if (!token) {
          router.push(`/${locale}/login`);
        }
        // If token exists, user might still be loading from Redux
      }
    }, 500); // Wait 500ms for Redux to load

    return () => clearTimeout(timer);
  }, [user, locale, router]);

  useEffect(() => {
    if (groceryList) {
      // console.log("GROCERY LIST DEBUG:", {
      //   id: groceryList._id,
      //   title: groceryList.title,
      //   instacartLink: groceryList.instacartDeepLink,
      //   hasLink: !!groceryList.instacartDeepLink,
      //   itemsCount: groceryList.items?.length,
      //   checkedItems: groceryList.items?.filter((i) => i.checked).length,
      // });
    }
  }, [groceryList]);

  const handleInstacartOrder = async () => {
    if (!groceryList) {
      toast.error("Grocery list not loaded");
      return;
    }

    const checkedItems = groceryList.items.filter(item => item.checked);

    if (checkedItems.length === 0) {
      toast.info("Please select items to order");
      return;
    }

    console.log("=== Processing Instacart Order ===");
    console.log("Selected items:", checkedItems.map(item => item.name));

    try {
      // Show loading
      toast.loading("Connecting to Instacart...");

      // Generate link with API
      const result = await generateInstacartLink(
        checkedItems,
        user?.tier || 'free',
        process.env.INSTACART_IMPACT_ID
      );

      console.log("Generated result:", result);

      // Track the click
      await trackInstacartClick({
        userId: user?._id || 'anonymous',
        groceryListId: groceryList._id,
        cartId: result.cartId,
        store: result.store,
        method: result.method,
        items: result.items,
        totalItems: checkedItems.length,
        matchedItems: result.matchedItems || 0,
        userTier: user?.tier || 'free'
      });

      // Show appropriate message
      toast.dismiss();

      if (result.method === 'api_cart') {
        toast.success(`Cart created with ${result.matchedItems} items!`);
      } else {
        toast.info("Opening Instacart search...");
      }

      // Open link
      setTimeout(() => {
        window.open(result.link, '_blank', 'noopener,noreferrer');
      }, 500);

    } catch (error) {
      console.error("Instacart error:", error);
      toast.dismiss();

      // Fallback to simple link
      const partnerId = process.env.INSTACART_IMPACT_ID || "6773996";
      const simpleLink = generateSimpleInstacartLink(checkedItems, partnerId);

      // Track fallback click
      await trackInstacartClick({
        userId: user?._id,
        groceryListId: groceryList._id,
        method: 'fallback',
        items: checkedItems.map(item => ({ groceryItem: item.name })),
        totalItems: checkedItems.length,
        userTier: user?.tier || 'free'
      });

      window.open(simpleLink, '_blank', 'noopener,noreferrer');
      toast.info("Opening Instacart...");
    }
  };
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
    // if (name.includes("oil")) return "Pantry";

    return "Other";
  };
  // Initialize all aisles as expanded by default
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

  // Toggle select all function
  const toggleSelectAll = async () => {
    if (!groceryList) return;

    const visibleItems = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const shouldSelectAll = !isAllSelected;
    const updatedItems = groceryList.items.map((item) => {
      // Only update items that are currently visible
      const isVisible = hidePantry ? !item.inPantry : true;
      if (isVisible) {
        return { ...item, checked: shouldSelectAll };
      }
      return item;
    });

    // Update local state
    setGroceryList({
      ...groceryList,
      items: updatedItems,
      checkedItems: updatedItems.filter((item) => item.checked).length,
    });

    // Save to database
    try {
      await fetchWithAuth(`/api/groceryLists/${groceryList._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          items: updatedItems,
          checkedItems: updatedItems.filter((item) => item.checked).length,
        }),
      });
    } catch (error) {
      toast.error("Failed to update selection");
    }
  };
  // Define markPantryItems function
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

          return groceryItems.map((item) => {
            // Check if item exists in pantry
            const inPantry = pantryItems.some((pantryItem) => {
              // Use exact normalized name matching
              const groceryNormalized =
                item.normalizedName?.toLowerCase() || item.name.toLowerCase();
              const pantryNormalized =
                pantryItem.normalizedName?.toLowerCase() ||
                pantryItem.name.toLowerCase();

              // Exact match or very close match
              return (
                groceryNormalized === pantryNormalized ||
                pantryNormalized.startsWith(groceryNormalized)
              );
            });

            return {
              ...item,
              inPantry,
              pantryQuantity: inPantry
                ? pantryItems.find(
                  (p) =>
                    p.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(p.name.toLowerCase())
                )?.quantity
                : null,
            };
          });
        }
      } catch (error) {
        console.error("Error checking pantry:", error);
      }

      return groceryItems.map((item) => ({ ...item, inPantry: false }));
    },
    [user]
  );

  // Fetch grocery list
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

          // Mark items that are in pantry
          const itemsWithPantryStatus = await markPantryItems(list.items);
          setGroceryList({
            ...list,
            items: itemsWithPantryStatus,
          });
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

  // Fetch user pantry
  const fetchUserPantry = useCallback(async () => {
    if (user?.tier === "free") return;

    try {
      // Move fetchWithAuth logic inline
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

  useEffect(() => {
    if (id) {
      fetchGroceryList(id);
    }
  }, [id, fetchGroceryList]);

  // Calculate grouped items
  const getGroupedItems = useCallback(() => {
    if (!groceryList?.items) return {};

    const itemsToDisplay = hidePantry
      ? groceryList.items.filter((item) => !item.inPantry)
      : groceryList.items;

    const itemsWithFixedAisles = itemsToDisplay.map((item) => ({
      ...item,
      displayAisle:
        item.aisle === "Other" ? categorizeItem(item.name) : item.aisle,
    }));

    const grouped = {};
    itemsWithFixedAisles.forEach((item) => {
      const aisle = item.displayAisle || item.aisle || item.category || "Other";
      if (!grouped[aisle]) {
        grouped[aisle] = [];
      }
      grouped[aisle].push(item);
    });

    return grouped;
  }, [groceryList, hidePantry]);

  const groupedItems = getGroupedItems();

  // Sort aisles according to aisleOrder
  const sortedAisles = Object.keys(groupedItems).sort((a, b) => {
    const indexA = aisleOrder.indexOf(a);
    const indexB = aisleOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Calculate totals
  const getProgressItems = useCallback(() => {
    if (!groceryList?.items) return [];

    return hidePantry
      ? groceryList.items.filter((item) => !item.inPantry) // Only non-pantry items count
      : groceryList.items; // All items count
  }, [groceryList, hidePantry]);

  // Use this for progress calculations
  const progressItems = getProgressItems();
  const visibleCheckedCount =
    progressItems.filter((item) => item.checked).length || 0;
  const visibleProgressItemsCount = progressItems.length || 0;
  const pantryItemsCount =
    groceryList?.items?.filter((item) => item.inPantry).length || 0;
  const checkedItemsCount =
    groceryList?.items?.filter((item) => item.checked).length || 0;

  const estimatedTotal =
    groceryList?.items?.reduce(
      (sum, item) => sum + (item.estimatedPrice || 0),
      0
    ) || 0;

  // toggleItemChecked function

  // const toggleItemChecked = async (itemId) => {
  //   if (!groceryList) return;

  //   // INSTANT UI UPDATE
  //   const updatedItems = groceryList.items.map((item) =>
  //     item._id === itemId ? { ...item, checked: !item.checked } : item
  //   );

  //   const checkedCount = updatedItems.filter((item) => item.checked).length;

  //   // Update state immediately (no waiting)
  //   setGroceryList({
  //     ...groceryList,
  //     items: updatedItems,
  //     checkedItems: checkedCount
  //   });

  //   // Save in background - NO TOAST, NO WAITING
  //   setTimeout(async () => {
  //     try {
  //       await fetchWithAuth(`/api/groceryLists/${groceryList._id}`, {
  //         method: "PATCH",
  //         body: JSON.stringify({
  //           items: updatedItems,
  //           checkedItems: checkedCount,
  //           totalItems: updatedItems.length,
  //         }),
  //       });
  //       // No toast - silent save
  //     } catch (error) {
  //       console.log("Background save failed (this is ok)", error);
  //     }
  //   }, 100); // Small delay to not block UI
  // };

  const toggleItemChecked = async (itemId) => {
    if (!groceryList) return;

    const updatedItems = groceryList.items.map((item) =>
      item._id === itemId ? { ...item, checked: !item.checked } : item
    );

    // Send ALL item properties, not just checked status
    const itemsToSend = updatedItems.map((item) => ({
      _id: item._id, // CRITICAL: Send the ID
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      aisle: item.aisle,
      checked: item.checked,
      // Include other fields that exist
      ...(item.estimatedPrice && { estimatedPrice: item.estimatedPrice }),
      ...(item.normalizedName && { normalizedName: item.normalizedName }),
    }));

    try {
      const response = await fetchWithAuth(
        `/api/groceryLists/${groceryList._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            items: itemsToSend, // Send ALL items with their IDs
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGroceryList(data.groceryList);
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };
  // updateQuantity function
  const updateQuantity = async (itemId, newQuantity) => {
    if (!groceryList || newQuantity < 0.1) return;

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

    const updatedList = {
      ...groceryList,
      items: updatedItems,
      estimatedTotal: updatedItems.reduce(
        (sum, item) => sum + (item.estimatedPrice || 0),
        0
      ),
    };

    setGroceryList(updatedList);

    // Save to database
    try {
      await fetchWithAuth(`/api/groceryLists/${groceryList._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          items: updatedItems,
          estimatedTotal: updatedList.estimatedTotal,
        }),
      });
    } catch (error) {
      toast.error("Failed to update quantity");
    }
  };

  // removeItem function
  const removeItem = async (itemId) => {
    if (!groceryList) return;

    if (!confirm("Remove this item from the list?")) return;

    const updatedItems = groceryList.items.filter(
      (item) => item._id !== itemId
    );

    try {
      const response = await fetchWithAuth(
        `/api/groceryLists/${groceryList._id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ items: updatedItems }),
        }
      );

      if (response.ok) {
        setGroceryList({ ...groceryList, items: updatedItems });
        toast.success("Item removed");
      }
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  // addNewItem function
  const addNewItem = async () => {
    if (!newItem.name.trim() || !groceryList) {
      toast.error("Please enter an item name");
      return;
    }

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

      // Create the updated items array
      const updatedItems = [...groceryList.items, newItemObj];

      // Call saveChanges with the updated items directly
      await saveChanges(updatedItems);

      // Only update local state and clear form AFTER successful save
      setGroceryList({ ...groceryList, items: updatedItems });
      setNewItem({ name: "", quantity: 1, unit: "unit", aisle: "Other" });

      toast.success("Item added!");
    } catch (error) {
      toast.error("Failed to add item");
    }
  };
  // price calculation
  const calculateEstimatedPrice = (name, quantity, unit) => {
    const itemName = name.toLowerCase();
    let pricePerUnit = 0;

    // More realistic Canadian prices
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

    // Adjust for different units
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

  // printList function
  const printList = () => {
    window.print();
  };
  // shareList function
  const shareList = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: groceryList?.title || "Grocery List",
          text: `Check out my grocery list from PrepCart`,
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

  // saveChanges function
  const saveChanges = async (itemsToSaveParam = null) => {
    if (!groceryList) return;
    const itemsToSave = itemsToSaveParam || groceryList.items;

    try {
      const processedItems = itemsToSave.map((item) => ({
        ...item,
        estimatedPrice:
          item.estimatedPrice ||
          calculateEstimatedPrice(item.name, item.quantity, item.unit),
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

      if (!response.ok) {
        throw new Error("Failed to save to server");
      }

      const data = await response.json();

      if (data.success && data.groceryList) {
        setGroceryList(data.groceryList);
        toast.success("Changes saved!");
        setIsEditing(false);
      } else {
        toast.error("Failed to save changes");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save changes");
    }
  };

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
      {/* <Navbar /> */}
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
                  <span>•</span>
                  <span className="font-semibold text-green-600">
                    Estimated: ${estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
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
                    width: `${visibleProgressItemsCount > 0
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
                    ${sortedAisles.length === 1
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
                            $
                            {groupedItems[aisle]
                              .reduce(
                                (sum, item) => sum + (item.estimatedPrice || 0),
                                0
                              )
                              .toFixed(2)}
                          </span>
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
                              className={`px-4 py-3 flex items-center gap-4 ${item.checked ? "bg-green-50" : ""
                                }`}
                            >
                              <button
                                onClick={() => toggleItemChecked(item._id)}
                                className={`
                                  h-5 w-5 rounded border flex items-center justify-center shrink-0
                                  transition-colors
                                  ${item.checked
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
                                  className={`font-medium ${item.checked
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
                              <span className="text-gray-600 text-sm font-medium min-w-[60px] text-right">
                                ${(item.estimatedPrice || 0).toFixed(2)}
                              </span>
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
                <p className="mt-1">
                  Note: Prices are estimates based on average Canadian grocery
                  prices.
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
            // Not logged in
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
            // No items selected
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
            // No Instacart link
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
            // ALL USERS CAN USE INSTACART
            // <button
            //   onClick={() => {
            //     console.log("BUTTON CLICKED - Checking items:");
            //     console.log("All items:", groceryList.items);
            //     console.log("Checked items:", groceryList.items.filter(item => item.checked));

            //     // Generate fresh link
            //     const checkedItems = groceryList.items.filter(item => item.checked);

            //     // Use a fallback if no items are checked
            //     if (checkedItems.length === 0) {
            //       const partnerId = process.env.INSTACART_IMPACT_ID || "6773996";
            //       window.open(`https://www.instacart.com/store/s?k=groceries&partner=${partnerId}`, "_blank");
            //       return;
            //     }

            //     const instacartLink = generateInstacartLink(
            //       checkedItems,
            //       user?.tier,
            //       process.env.INSTACART_IMPACT_ID
            //     );


            //     console.log("Generated link:", instacartLink);
            //     window.open(instacartLink, "_blank");
            //   }}
            //   className="bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-bold hover:bg-green-50 flex items-center mx-auto cursor-pointer"
            // >
            //   <ShoppingCart className="h-5 w-5 mr-2" />
            //   Order {visibleCheckedCount} items on Instacart
            // </button>
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
    </section>
  );
}

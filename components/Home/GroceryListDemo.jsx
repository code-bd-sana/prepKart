"use client";

import { useState } from "react";
import { Edit2, ShoppingCart, Check } from "lucide-react";

const initialItems = [
  // Produce
  {
    id: "1",
    name: "Bananas",
    quantity: 6,
    unit: "",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },
  {
    id: "2",
    name: "Berries",
    quantity: 2,
    unit: "cups",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },
  {
    id: "3",
    name: "Avocados",
    quantity: 3,
    unit: "",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },
  {
    id: "4",
    name: "Spinach",
    quantity: 1,
    unit: "bunch",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },
  {
    id: "5",
    name: "Tomatoes",
    quantity: 4,
    unit: "",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },
  {
    id: "6",
    name: "Bell Peppers",
    quantity: 2,
    unit: "",
    aisle: "Produce",
    category: "Produce",
    inPantry: false,
    checked: false,
  },

  // Proteins
  {
    id: "7",
    name: "Chicken Breast",
    quantity: 1,
    unit: "lb",
    aisle: "Proteins",
    category: "Proteins",
    inPantry: false,
    checked: false,
  },
  {
    id: "8",
    name: "Salmon Fillets",
    quantity: 2,
    unit: "",
    aisle: "Proteins",
    category: "Proteins",
    inPantry: false,
    checked: false,
  },
  {
    id: "9",
    name: "Ground Beef",
    quantity: 1,
    unit: "lb",
    aisle: "Proteins",
    category: "Proteins",
    inPantry: false,
    checked: false,
  },
  {
    id: "10",
    name: "Eggs",
    quantity: 1,
    unit: "dozen",
    aisle: "Proteins",
    category: "Proteins",
    inPantry: false,
    checked: false,
  },
  {
    id: "11",
    name: "Greek Yogurt",
    quantity: 1,
    unit: "500g",
    aisle: "Proteins",
    category: "Proteins",
    inPantry: false,
    checked: false,
  },

  // Dairy
  {
    id: "12",
    name: "Milk",
    quantity: 2,
    unit: "L",
    aisle: "Dairy",
    category: "Dairy",
    inPantry: true,
    checked: false,
  },
  {
    id: "13",
    name: "Cheddar Cheese",
    quantity: 1,
    unit: "200g",
    aisle: "Dairy",
    category: "Dairy",
    inPantry: false,
    checked: false,
  },
  {
    id: "14",
    name: "Mozzarella",
    quantity: 1,
    unit: "200g",
    aisle: "Dairy",
    category: "Dairy",
    inPantry: false,
    checked: false,
  },
  {
    id: "15",
    name: "Butter",
    quantity: 1,
    unit: "package",
    aisle: "Dairy",
    category: "Dairy",
    inPantry: true,
    checked: false,
  },

  // Pantry
  {
    id: "16",
    name: "Olive Oil",
    quantity: 1,
    unit: "bottle",
    aisle: "Pantry",
    category: "Pantry",
    inPantry: true,
    checked: false,
  },
  {
    id: "17",
    name: "Maple Syrup",
    quantity: 1,
    unit: "bottle",
    aisle: "Pantry",
    category: "Pantry",
    inPantry: true,
    checked: false,
  },
  {
    id: "18",
    name: "Canned Tomatoes",
    quantity: 2,
    unit: "cans",
    aisle: "Pantry",
    category: "Pantry",
    inPantry: true,
    checked: false,
  },
  {
    id: "19",
    name: "Chicken Broth",
    quantity: 1,
    unit: "carton",
    aisle: "Pantry",
    category: "Pantry",
    inPantry: true,
    checked: false,
  },

  // Snacks
  {
    id: "20",
    name: "Almonds",
    quantity: 1,
    unit: "200g",
    aisle: "Snacks",
    category: "Snacks",
    inPantry: false,
    checked: false,
  },
  {
    id: "21",
    name: "Peanut Butter",
    quantity: 1,
    unit: "jar",
    aisle: "Snacks",
    category: "Snacks",
    inPantry: false,
    checked: false,
  },
  {
    id: "22",
    name: "Protein Bars",
    quantity: 1,
    unit: "6 pack",
    aisle: "Snacks",
    category: "Snacks",
    inPantry: false,
    checked: false,
  },
];

const aisleOrder = ["Produce", "Proteins", "Dairy", "Pantry", "Snacks"];

export default function GroceryListDemo() {
  const [items, setItems] = useState(initialItems);
  const [hidePantry, setHidePantry] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const toggleItemChecked = (id) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 0) return;
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const filteredItems = hidePantry
    ? items.filter((item) => !item.inPantry)
    : items;

  const groupedItems = aisleOrder.reduce((acc, aisle) => {
    const aisleItems = filteredItems.filter((item) => item.aisle === aisle);
    if (aisleItems.length > 0) {
      acc[aisle] = aisleItems;
    }
    return acc;
  }, {});

  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;

  return (
    <section className="py-8 md:py-16" id="recipes">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-[#1E1E1E] mb-3">
            Your Weekly Grocery List (Canada-ready)
          </h2>
          <p className="text-base text-[#666666] max-w-[570px] mx-auto">
            Auto-categorized, editable, and ready to order. Save time with our
            smart pantry toggle.
          </p>
        </div>

        <div className="rounded-xl mx-auto max-w-[1200px]">
          {/* Card Header */}
          <div className="p-6 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-2xl font-semibold text-gray-900">
                Weekly Grocery List
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="
                    h-9 px-4
                    rounded-lg
                    
                    bg-white
                    hover:bg-gray-50
                    transition-colors
                    text-sm font-medium text-gray-700
                    flex items-center gap-2
                  "
                >
                  <Edit2 className="h-4 w-4" />
                  {isEditing ? "Done Editing" : "Edit List"}
                </button>

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
                    Hide Pantry Items
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-2 text-sm">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {checkedCount} of {totalCount} items checked
                </span>
              </div>
            </div>

            {/* Weekly Grocery List */}
            <div className="space-y-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(groupedItems).map(([aisle, aisleItems]) => (
                <div
                  key={aisle}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-[#568515]">{aisle}</h3>
                      <span className="text-sm text-gray-600">
                        ({aisleItems.length} items)
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {aisleItems.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 flex items-center gap-4 ${
                          item.checked ? "bg-green-50" : ""
                        }`}
                      >
                        <button
                          onClick={() => toggleItemChecked(item.id)}
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

                        <div className="flex-1 flex items-center">
                          <span
                            className={`font-medium ${
                              item.checked
                                ? "text-green-700 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.inPantry && (
                            <span className="ml-2 inline-flex items-center rounded-full border border-[#4a9fd8] px-2 py-0.5 text-xs font-medium text-[#4a9fd8]">
                              In Pantry
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                              className="
                                h-6 w-6 rounded border border-gray-300 
                                flex items-center justify-center
                                hover:bg-gray-50 transition-colors
                                text-gray-600
                              "
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              className="
                                h-6 w-6 rounded border border-gray-300 
                                flex items-center justify-center
                                hover:bg-gray-50 transition-colors
                                text-gray-600
                              "
                            >
                              +
                            </button>
                            {item.unit && (
                              <span className="text-gray-600 text-sm w-12">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 text-sm">
                            {item.quantity} {item.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Section */}
            <div className="mt-16 bg-linear-to-r from-[#5a9e3a] to-[#4a9fd8] rounded-2xl px-8 md:px-16 py-8 text-center text-white max-w-[1500px] mx-auto">
              <div className="text-center">
                <h3 className="text-xl md:text-3xl font-semibold mb-3">
                  Ready to Shop?
                </h3>
                <p className="text-base md:text-sm mb-6 opacity-95">
                  Your grocery list is organized and ready. Order with one click
                  and get it delivered to your door.
                </p>
                <button
                  className="
                    bg-white text-[#5a9e3a] py-3 px-8 rounded-lg font-semibold flex items-center gap-2 mx-auto hover:bg-gray-50 transition-colors
                  "
                >
                  <ShoppingCart className="h-5 w-5" />
                  Order Ingredients on Instacart
                </button>
                <p className="text-base md:text-xs my-3 opacity-95">
                  Cart loads automatically with affiliate tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

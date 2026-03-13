/**
 * Parses an address object, which might be in an old text-only format,
 * into a structured address object.
 * @param {object} addressItem The address object from storage.
 * @param {string} [userName=''] The current user's name as a fallback.
 * @returns {object} A structured address object.
 */
export const parseAddressText = (addressItem, userName = "") => {
  let parsedData = {
    fullName: userName,
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  };

  if (!addressItem) return parsedData;

  // If the object is already in the new, structured format, use it directly.
  if (addressItem.fullName || addressItem.phone || addressItem.street) {
    return {
      fullName: addressItem.fullName || userName,
      phone: addressItem.phone || "",
      street: addressItem.street || "",
      city: addressItem.city || "",
      state: addressItem.state || "",
      pincode: addressItem.pincode || "",
    };
  }

  // Fallback for old, comma-separated text format.
  if (addressItem.text) {
    const parts = addressItem.text.split(", ");
    if (parts.length >= 5) { // Check for at least Name, Phone, Street, City, State
      parsedData.fullName = parts[0] || userName;
      parsedData.phone = parts[1] || "";
      parsedData.street = parts[2] || "";
      parsedData.city = parts[3] || "";
      // Pincode might be attached to state like "State - Pincode"
      const stateAndPincode = (parts[4] || "").split(" - ");
      parsedData.state = stateAndPincode[0] || "";
      parsedData.pincode = stateAndPincode[1] || (parts[5] || "").replace(/^-\s*/, "") || "";
    }
  }

  return parsedData;
};
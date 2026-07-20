// priceFormatter.js
// Utility to format livestock prices based on Indian Numbering system and currency.

export const formatPrice = (price) => {
  const numValue = parseFloat(price) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(numValue);
  } catch (e) {
    // Basic fallback representation
    return '₹' + numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
};

export default formatPrice;

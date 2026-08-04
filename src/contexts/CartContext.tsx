import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string, weightKg?: number) => void;
  updateQuantity: (productId: string, quantity: number, weightKg?: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('lvf_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lvf_cart', JSON.stringify(cart));
  }, [cart]);

  const matchesItem = (p1: Product, productId: string, weightKg?: number) => {
    if (p1.id !== productId) return false;
    if (weightKg !== undefined) {
      return p1.weightKg === weightKg;
    }
    return true;
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && item.product.weightKg === product.weightKg
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string, weightKg?: number) => {
    setCart(prev => prev.filter(item => !matchesItem(item.product, productId, weightKg)));
  };

  const updateQuantity = (productId: string, quantity: number, weightKg?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, weightKg);
      return;
    }
    setCart(prev => prev.map(item => 
      matchesItem(item.product, productId, weightKg) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalAmount,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

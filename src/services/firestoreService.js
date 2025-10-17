import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Generic CRUD operations
export const firestoreService = {
  // Get all documents from a collection
  getAll: async (collectionName) => {
  const querySnapshot = await getDocs(collection(db, collectionName));

  console.log('📦 Full Query Snapshot:', querySnapshot);

  const results = querySnapshot.docs.map(doc => {
    const data = doc.data();
    const fullDoc = {
      id: doc.id,
      ...data
    };

    console.log('📄 Firestore Document:', fullDoc);
    return fullDoc;
  });

  return results;
},


  // Get document by ID
  getById: async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  // Add new document
  add: async (collectionName, data) => {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // Update document
  update: async (collectionName, id, data) => {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  // Delete document
  delete: async (collectionName, id) => {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  },

  // Query documents
  query: async (collectionName, conditions) => {
    const constraints = [];
    conditions.forEach(condition => {
      constraints.push(where(condition.field, condition.operator, condition.value));
    });
    
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

// Specific collection services
export const restaurantService = {
  // Get all restaurants
  getRestaurants: async () => {
    return await firestoreService.getAll('restaurants');
  },

  // Get restaurant by ID
  getRestaurant: async (id) => {
    return await firestoreService.getById('restaurants', id);
  },

  // Add new restaurant
  addRestaurant: async (restaurantData) => {
    return await firestoreService.add('restaurants', restaurantData);
  },

  // Update restaurant
  updateRestaurant: async (id, restaurantData) => {
    return await firestoreService.update('restaurants', id, restaurantData);
  },

  // Delete restaurant
  deleteRestaurant: async (id) => {
    return await firestoreService.delete('restaurants', id);
  },

  // Get menu items for a restaurant
  getMenuItems: async (restaurantId) => {
    const querySnapshot = await getDocs(
      collection(db, 'restaurants', restaurantId, 'menu')
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Add menu item
  addMenuItem: async (restaurantId, menuItemData) => {
    const docRef = await addDoc(
      collection(db, 'restaurants', restaurantId, 'menu'), 
      {
        ...menuItemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );
    return docRef.id;
  },

  // Update menu item
  updateMenuItem: async (restaurantId, menuItemId, menuItemData) => {
    const docRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId);
    await updateDoc(docRef, {
      ...menuItemData,
      updatedAt: serverTimestamp()
    });
  },

  // Delete menu item
  deleteMenuItem: async (restaurantId, menuItemId) => {
    const docRef = doc(db, 'restaurants', restaurantId, 'menu', menuItemId);
    await deleteDoc(docRef);
  }
};

export const orderService = {
  // Get all orders
  getOrders: async () => {
    const querySnapshot = await getDocs(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get orders by status
  getOrdersByStatus: async (status) => {
    const q = query(
      collection(db, 'orders'), 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Update order status
  updateOrderStatus: async (orderId, status) => {
    const docRef = doc(db, 'orders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  },

  // Get orders by restaurant
  getOrdersByRestaurant: async (restaurantId) => {
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

export const groceryService = {
  // Get all grocery items
  getGroceryItems: async () => {
    const querySnapshot = await getDocs(collection(db, 'groceryItems'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Add grocery item
  addGroceryItem: async (itemData) => {
    return await firestoreService.add('groceryItems', itemData);
  },

  // Update grocery item
  updateGroceryItem: async (id, itemData) => {
    return await firestoreService.update('groceryItems', id, itemData);
  },

  // Delete grocery item
  deleteGroceryItem: async (id) => {
    return await firestoreService.delete('groceryItems', id);
  },

  // Get grocery orders
  getGroceryOrders: async () => {
    const querySnapshot = await getDocs(
      query(collection(db, 'groceryOrders'), orderBy('createdAt', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Update grocery order status
  updateGroceryOrderStatus: async (orderId, status) => {
    const docRef = doc(db, 'groceryOrders', orderId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
  }
};
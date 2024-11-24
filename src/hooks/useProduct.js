import { useEffect, useState } from 'react';
import axios from 'axios';
import { useDidMount } from '@/hooks'; // Assuming this is a custom hook

const useProduct = (id) => {
  const [product, setProduct] = useState(null);  // Default to null if no product is found
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const didMount = useDidMount(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);  // Start loading state
        const response = await axios.get(`http://localhost:5002/products/${id}`);
        
        // If product is found
        if (response.data) {
          if (didMount) {
            setProduct(response.data);  // Update state with the product data
            setLoading(false);  // End loading state
          }
        } else {
          setError('Product not found.');
        }
      } catch (err) {
        if (didMount) {
          setLoading(false);
          setError(err?.message || 'Something went wrong.');
        }
      }
    };

    fetchProduct();
  }, [id, didMount]);  // Re-run when id or didMount changes

  return { product, isLoading, error };
};

export default useProduct;

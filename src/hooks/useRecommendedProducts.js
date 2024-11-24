import { useDidMount } from '@/hooks';
import { useEffect, useState } from 'react';
import axios from 'axios';

const useRecommendedProducts = (itemsCount) => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const didMount = useDidMount(true);

  const fetchRecommendedProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const itemsCount = 10;
      const response = await axios.get('http://localhost:5002/products', {
        params: {
          isRecommended: true, 
          _limit: itemsCount 
        }
      });
      if (!response.statusText=="OK") {
        throw new Error('Failed to fetch featured products');
      }
      if (response.data.length == 0) {
        if (didMount) {
          setError('No recommended products found.');
          setLoading(false);
        }
      } else {
        const items = [];

        response.data.forEach((product) => {
          items.push({ ...product });
        });

        if (didMount) {
          setRecommendedProducts(items);
          setLoading(false);
        }
      }
    } catch (e) {
      if (didMount) {
        setError('Failed to fetch recommended products');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (recommendedProducts.length === 0 && didMount) {
      fetchRecommendedProducts();
    }
  }, []);


  return {
    recommendedProducts, fetchRecommendedProducts, isLoading, error
  };
};

export default useRecommendedProducts;

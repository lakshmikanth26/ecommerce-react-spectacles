import axios from 'axios';
import {
  ADD_PRODUCT,
  EDIT_PRODUCT,
  GET_PRODUCTS,
  REMOVE_PRODUCT,
  SEARCH_PRODUCT
} from '@/constants/constants';
import { ADMIN_PRODUCTS } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import {
  all, call, put, select
} from 'redux-saga/effects';
import { setLoading, setRequestStatus } from '@/redux/actions/miscActions';
import { history } from '@/routers/AppRouter';
import {
  addProductSuccess,
  clearSearchState,
  editProductSuccess,
  getProductsSuccess,
  removeProductSuccess,
  searchProductSuccess
} from '../actions/productActions';

function* initRequest() {
  yield put(setLoading(true));
  yield put(setRequestStatus(null));
}

function* handleError(e) {
  yield put(setLoading(false));
  yield put(setRequestStatus(e?.message || 'Failed to fetch products'));
  console.log('ERROR: ', e);
}

function* handleAction(location, message, status) {
  if (location) yield call(history.push, location);
  yield call(displayActionMessage, message, status);
}

function* productSaga({ type, payload }) {
  switch (type) {
    case GET_PRODUCTS:
      try {
        yield initRequest();
        const state = yield select();
        const result = yield call(axios.get, 'http://localhost:5002/products/', { params: payload });

        const products = result.data || [];

        if (products.length === 0) {
          yield handleError('No items found.');
        } else {
          yield put(getProductsSuccess({
            products,  // Array format
            lastKey: result.lastKey ? result.lastKey : state.products.lastRefKey,
            total: result.total ? result.total : state.products.total
          }));
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;

    case ADD_PRODUCT: {
      try {
        yield initRequest();

        // Upload image to a local server
        const formData = new FormData();
        formData.append('image', payload.image);
        const uploadResponse = yield call(axios.post, 'http://localhost:5001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const product = {
          ...payload,
          image: uploadResponse.data.filePath
        };

        // Add product to JSON server
        const response = yield call(axios.post, 'http://localhost:5002/products', product);

        yield put(addProductSuccess(response.data));
        yield handleAction(ADMIN_PRODUCTS, 'Item successfully added', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;
    }

    case EDIT_PRODUCT: {
      try {
        yield initRequest();

        const { image, imageCollection } = payload.updates;
        let newUpdates = { ...payload.updates };

        // Handle image upload for new image
        if (image && image.constructor === File) {
          const formData = new FormData();
          formData.append('image', image);
          const uploadResponse = yield call(axios.post, 'http://localhost:5001/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          newUpdates = { ...newUpdates, image: uploadResponse.data.filePath };
        }

        // Handle image collection updates
        if (imageCollection && imageCollection.length > 1) {
          const newUploads = imageCollection.filter(img => img.file);
          const uploadedImages = yield all(
            newUploads.map((img) => {
              const formData = new FormData();
              formData.append('image', img.file);
              return axios.post('http://localhost:5001/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            })
          );

          const updatedImages = uploadedImages.map(response => ({
            id: new Date().getTime(),
            url: response.data.filePath
          }));
          newUpdates = { ...newUpdates, imageCollection: [...imageCollection, ...updatedImages] };
        }

        // Update product in JSON server
        const response = yield call(axios.put, `http://localhost:5002/products/${payload.id}`, newUpdates);

        yield put(editProductSuccess({
          id: payload.id,
          updates: newUpdates
        }));
        yield handleAction(ADMIN_PRODUCTS, 'Item successfully edited', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(undefined, `Item failed to edit: ${e.message}`, 'error');
      }
      break;
    }

    case REMOVE_PRODUCT: {
      try {
        yield initRequest();
        yield call(axios.delete, `http://localhost:5002/products/${payload}`);
        yield put(removeProductSuccess(payload));
        yield put(setLoading(false));
        yield handleAction(ADMIN_PRODUCTS, 'Item successfully removed', 'success');
      } catch (e) {
        yield handleError(e);
        yield handleAction(undefined, `Item failed to remove: ${e.message}`, 'error');
      }
      break;
    }

    case SEARCH_PRODUCT: {
      try {
        yield initRequest();
        yield put(clearSearchState());

        const state = yield select();
        const result = yield call(axios.get, 'http://localhost:5002/products', {
          params: { searchKey: payload.searchKey }
        });

        const products = result.data || []; // Ensure products is an array

        if (products.length === 0) {
          yield handleError({ message: 'No product found.' });
          yield put(clearSearchState());
        } else {
          yield put(searchProductSuccess({
            products,  // Array format
            lastKey: result.lastKey ? result.lastKey : state.products.searchedProducts.lastRefKey,
            total: result.total ? result.total : state.products.searchedProducts.total
          }));
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;
    }

    default: {
      throw new Error(`Unexpected action type ${type}`);
    }
  }
}

export default productSaga;

import { ref, onMounted } from 'vue';
import apiService from '../services/apiService';

export default {
  setup() {
    const data = ref(null);
    const loading = ref(false);
    const error = ref(null);

    const fetchData = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // Example: Fetch data from your Django API endpoint
        data.value = await apiService.get('/your-endpoint/');
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const postData = async (newData) => {
      try {
        const result = await apiService.post('/your-endpoint/', newData);
        console.log('Data posted successfully:', result);
        return result;
      } catch (err) {
        console.error('Failed to post data:', err);
        throw err;
      }
    };

    onMounted(() => {
      fetchData();
    });

    return {
      data,
      loading,
      error,
      fetchData,
      postData,
    };
  },
};
import { useContext } from 'react';
import { UpdateSwiperContext } from '../contexts';

const useUpdateSwiperContext = () => {
  const context = useContext(UpdateSwiperContext);

  if (!context) {
    throw Error('useUpdateSwiperContext must be inside Provider');
  }

  return context;
};

export default useUpdateSwiperContext;

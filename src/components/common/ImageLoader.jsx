import { LoadingOutlined } from '@ant-design/icons';
import PropType from 'prop-types';
import React, { useState } from 'react';

const ImageLoader = ({ src, alt, className }) => {
  const valuesToCheck = ['http://localhost:5002', 'data:image'];
  src = valuesToCheck.some(value => src.includes(value)) ? src : `http://localhost:5002${src}`;
  console.log(src);
  const loadedImages = {};
  const [loaded, setLoaded] = useState(loadedImages[src]);

  const onLoad = () => {
    loadedImages[src] = true;
    setLoaded(true);
  };

  const fallbackImage = 'http://localhost:5002/default-placeholder.jpg';

  return (
    <div className="image-container">
      {!loaded && (
        <LoadingOutlined
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            margin: 'auto',
          }}
        />
      )}
      <img
        alt={alt || ''}
        className={`${className || ''} ${loaded ? 'is-img-loaded' : 'is-img-loading'}`}
        onLoad={onLoad}
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop in case fallback fails
          e.target.src = fallbackImage;
        }}
        src={src}
      />
    </div>
  );
};

ImageLoader.defaultProps = {
  className: 'image-loader',
};

ImageLoader.propTypes = {
  src: PropType.string.isRequired,
  alt: PropType.string,
  className: PropType.string,
};

export default ImageLoader;

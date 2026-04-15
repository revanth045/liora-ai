
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string;
    fallbackSrc?: string;
    containerClassName?: string;
}

export const SmartImage: React.FC<SmartImageProps> = ({ src, alt, className, containerClassName, fallbackSrc, ...props }) => {
    const [imgSrc, setImgSrc] = useState<string | undefined>(src);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
        setImgSrc(src);
        setStatus('loading');
    }, [src]);

    const handleError = () => {
        if (fallbackSrc && imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc);
            // Don't set error yet, try fallback
        } else {
            setStatus('error');
        }
    };

    return (
        <div className={`relative overflow-hidden bg-cream-100/50 ${containerClassName || ''}`}>
            {status === 'loading' && (
                <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-cream-100/80 z-10">
                    <Spinner />
                </div>
            )}
            {status === 'error' ? (
                <div className="absolute inset-0 flex items-center justify-center text-stone-400 bg-cream-100/50">
                    <Icon name="camera" className="w-8 h-8" />
                </div>
            ) : (
                <img
                    {...props}
                    src={imgSrc}
                    alt={alt}
                    className={`${className} transition-opacity duration-300 ${status === 'loading' ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setStatus('loaded')}
                    onError={handleError}
                    loading="lazy"
                />
            )}
        </div>
    );
};

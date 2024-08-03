// src/LoadingSpinner.js
import { useSpring, animated, config } from '@react-spring/web';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = () => {
  const props1 = useSpring({
    loop: { reverse: true },
    from: { scale: 1 },
    to: { scale: 1.5 },
    config: config.wobbly,
  });

  const props2 = useSpring({
    loop: { reverse: true },
    from: { scale: 1 },
    to: { scale: 1.5 },
    delay: 200,
    config: config.wobbly,
  });

  const props3 = useSpring({
    loop: { reverse: true },
    from: { scale: 1 },
    to: { scale: 1.5 },
    delay: 400,
    config: config.wobbly,
  });

  return (
    <div className={styles.loading}>
      <animated.div className={`${styles.circle} ${styles.circle1}`} style={props1}></animated.div>
      <animated.div className={`${styles.circle} ${styles.circle2}`} style={props2}></animated.div>
      <animated.div className={`${styles.circle} ${styles.circle3}`} style={props3}></animated.div>
    </div>
  );
};

export default LoadingSpinner;

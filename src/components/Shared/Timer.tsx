import React, { useState, useEffect } from 'react';

interface TimerProps {
  deadline: string;
  onExpire?: () => void;
}

const Timer: React.FC<TimerProps> = ({ deadline, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00');
        if (onExpire) onExpire();
        return false; // Indicate timer has expired
      }

      const minutes = Math.floor((diff / 1000) / 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      return true; // Indicate timer is still running
    };

    if (calculateTimeLeft()) {
      const interval = setInterval(() => {
        if (!calculateTimeLeft()) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [deadline, onExpire]);

  return <span className="font-semibold">{timeLeft}</span>;
};

export default Timer;

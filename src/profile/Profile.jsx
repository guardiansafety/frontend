import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [details, setDetails] = useState({ email: user?.email || '', username: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:3006/profile?userId=${user.sub}`);
        const data = await response.json();
        setDetails({ email: data.email, username: data.username });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      await fetch('http://localhost:3006/api/update-user', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Id: user.sub,
          email: details.email,
          username: details.username,
        }),
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    }
  };

  return (
    <div className={styles.profileContainer}>
      <h1 className={styles.profileTitle}>Update Profile</h1>
      <form onSubmit={handleSubmit} className={styles.profileForm}>
        <div className={styles.formGroup}>
          <label htmlFor="username" className={styles.formLabel}>
            Username:
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={details.username}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={details.email}
            onChange={handleChange}
            className={styles.formInput}
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Profile;

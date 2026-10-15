const response = await axiosInstance.put("/profile/me", profileData);
return response.data.user;
//app/frontend/src/redux/reducers/profile/updateProfile.js
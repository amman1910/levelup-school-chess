import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const ManageMaterials = ({ users, loading, setLoading, error, success, fetchMaterials }) => {
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    file: null,
    trainerId: ''
  });

  const handleMaterialChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      setNewMaterial({ ...newMaterial, file: files[0] });
    } else {
      setNewMaterial({ ...newMaterial, [name]: value });
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setLoading(true);
    error('');
    success('');

    try {
      if (!newMaterial.title || !newMaterial.file || !newMaterial.trainerId) {
        error('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg'];
      if (!validTypes.includes(newMaterial.file.type)) {
        error('Only PDF, PNG, or JPEG files are allowed');
        setLoading(false);
        return;
      }

      // Validate file size (e.g., max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (newMaterial.file.size > maxSize) {
        error('File size must be less than 5MB');
        setLoading(false);
        return;
      }

      // Upload file to Firebase Storage
      const storage = getStorage();
      const fileExtension = newMaterial.file.name.split('.').pop();
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storageRef = ref(storage, `materials/${fileId}.${fileExtension}`);
      await uploadBytes(storageRef, newMaterial.file);
      const fileUrl = await getDownloadURL(storageRef);

      // Save metadata to Firestore
      await setDoc(doc(db, 'materials', fileId), {
        title: newMaterial.title,
        fileUrl,
        fileType: newMaterial.file.type,
        trainerId: newMaterial.trainerId,
        createdAt: new Date()
      });

      success('Material added successfully!');
      setNewMaterial({
        title: '',
        file: null,
        trainerId: ''
      });
      // Reset file input
      document.getElementById('materialFile').value = '';
      fetchMaterials();
    } catch (err) {
      console.error('Error:', err);
      error('Failed to add material');
    }
    setLoading(false);
  };

  const handleDeleteMaterial = async (materialId, fileUrl) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;
    setLoading(true);
    try {
      // Delete file from Firebase Storage
      const storage = getStorage();
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);

      // Delete metadata from Firestore
      await deleteDoc(doc(db, 'materials', materialId));

      success('Material deleted successfully');
      fetchMaterials();
    } catch (err) {
      console.error('Error:', err);
      error('Failed to delete material');
    }
    setLoading(false);
  };

  return (
    <div className="material-management-container">
      <div className="add-user-section">
        <h2>Add New Material</h2>
        <form onSubmit={handleAddMaterial} className="add-user-form">
          <div className="form-row">
            <div className="form-group">
              <label>Title*</label>
              <input
                type="text"
                name="title"
                value={newMaterial.title}
                onChange={handleMaterialChange}
                placeholder="Material Title"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>File (PDF or Image)*</label>
              <input
                type="file"
                id="materialFile"
                name="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={handleMaterialChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Assigned Trainer*</label>
              <select
                name="trainerId"
                value={newMaterial.trainerId}
                onChange={handleMaterialChange}
                required
              >
                <option value="">Select Trainer</option>
                {users
                  .filter(u => u.role === 'trainer')
                  .map(trainer => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.firstName} {trainer.lastName}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="add-button" disabled={loading}>
              {loading ? 'Uploading...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>

      <div className="user-list-section">
        <div className="users-list-header">
          <h3>Materials List</h3>
          <button
            onClick={fetchMaterials}
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh List'}
          </button>
        </div>

        {loading ? (
          <div className="loading-users">Loading materials...</div>
        ) : (
          <div className="users-table-wrapper">
            {materials.length > 0 ? (
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>File Type</th>
                    <th>Trainer</th>
                    <th>File</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(material => (
                    <tr key={material.id}>
                      <td>{material.title}</td>
                      <td>{material.fileType.split('/')[1].toUpperCase()}</td>
                      <td>
                        {users.find(u => u.id === material.trainerId)?.firstName}{' '}
                        {users.find(u => u.id === material.trainerId)?.lastName || 'Unknown'}
                      </td>
                      <td>
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                          View File
                        </a>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="delete-button"
                            onClick={() => handleDeleteMaterial(material.id, material.fileUrl)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-users">
                No materials found. Add your first material.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMaterials;
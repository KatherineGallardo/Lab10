// contains the Puppies component that will display the list of puppies fetched from the backend API
// contains the form to add, delete, and update puppies
// Lab 10 changed how API routes were written and added authentication

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAsgardeo } from '@asgardeo/react';

// create an axios instance with the base URL from the environment variable
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

// Puppies table app with CRUD operations
const Body = () => {
  const auth = useAsgardeo();

  // stores the JWT access token used to authenticate requests to the backend API
  // Lab 10 change: added token-based authentication
  const [accessToken, setAccessToken] = useState(null);

  // stores the list of puppies returned from the backend API for display in the table
  const [puppies, setPuppies] = useState([]);

  // stores the current values entered in the form inputs for add, delete, and update actions
  const [form, setForm] = useState({
    id: '',
    name: '',
    breed: '',
    age: '',
  });

  // load access token from Asgardeo for JWT authentication
  // Lab 10 change: data now depends on whether the user is signed in
  useEffect(() => {
    if (!auth?.isSignedIn) {
      setAccessToken(null);
      setPuppies([]);
      return;
    }

    const loadToken = async () => {
      try {
        const token = await auth.getAccessToken?.();
        setAccessToken(token || null);
      } catch (error) {
        console.error('Failed to load access token:', error);
        setAccessToken(null);
        setPuppies([]);
      }
    };

    loadToken();
  }, [auth]);

  // set up authorization header using access token
  // Lab 10 change: protected routes now require a Bearer token
  const getAuthHeaders = useCallback(() => {
    if (accessToken) {
      return {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      };
    }

    return {};
  }, [accessToken]);

  // fetch all puppies
  const load = useCallback(async () => {
    const authHeaders = getAuthHeaders();

    // do not try to load protected data unless auth headers exist
    if (!authHeaders.headers) {
      setPuppies([]);
      return;
    }

    try {
      // Lab 9 used unprotected routes, while Lab 10 uses protected /api routes
      const res = await api.get('/api/puppies', authHeaders);
      setPuppies(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load puppies:', error.response?.data || error.message);
      setPuppies([]);
    }
  }, [getAuthHeaders]);

  // load puppies when token changes
  useEffect(() => {
    load();
  }, [load]);

  // handle form input changes
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // reset form after add, delete, or update
  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      breed: '',
      age: '',
    });
  };

  // add puppy
  const onSubmit = async (e) => {
    e.preventDefault();

    const authHeaders = getAuthHeaders();

    // stop form submission if user is not signed in
    if (!authHeaders.headers) {
      alert('Please sign in before adding a puppy.');
      return;
    }

    try {
      await api.post(
        '/api/puppies',
        {
          name: form.name,
          breed: form.breed,
          age: form.age,
        },
        authHeaders
      );

      resetForm();
      await load();
    } catch (error) {
      console.error('Failed to add puppy:', error.response?.data || error.message);
      alert('Failed to add puppy. Please check the form and try again.');
    }
  };

  // delete puppy by id
  const onDelete = async (e) => {
    e.preventDefault();

    const authHeaders = getAuthHeaders();

    // stop form submission if user is not signed in
    if (!authHeaders.headers) {
      alert('Please sign in before deleting a puppy.');
      return;
    }

    try {
      await api.delete(`/api/puppies/${form.id}`, authHeaders);

      resetForm();
      await load();
    } catch (error) {
      console.error('Failed to delete puppy:', error.response?.data || error.message);
      alert('Failed to delete puppy. Please check the ID and try again.');
    }
  };

  // update puppy by id
  const onUpdate = async (e) => {
    e.preventDefault();

    const authHeaders = getAuthHeaders();

    // stop form submission if user is not signed in
    if (!authHeaders.headers) {
      alert('Please sign in before updating a puppy.');
      return;
    }

    try {
      await api.put(
        `/api/puppies/${form.id}`,
        {
          name: form.name,
          breed: form.breed,
          age: form.age,
        },
        authHeaders
      );

      resetForm();
      await load();
    } catch (error) {
      console.error('Failed to update puppy:', error.response?.data || error.message);
      alert('Failed to update puppy. Please make sure all required fields are filled in.');
    }
  };

  return (
    // create the main table with data from the puppies database
    <main className="app-main">
      <section className="data-section">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Puppy ID</th>
                <th>Name</th>
                <th>Breed</th>
                <th>Age</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {/* show puppy rows only when the user is signed in and puppy data exists */}
              {auth?.isSignedIn && puppies.length > 0 &&
                puppies.map((pup) => (
                  <tr key={pup.id}>
                    <td>{pup.id}</td>
                    <td>{pup.name}</td>
                    <td>{pup.breed}</td>
                    <td>{pup.age}</td>
                    <td>{pup.user_id}</td>
                  </tr>
                ))}

              {/* show a message row when the user is not signed in */}
              {!auth?.isSignedIn && (
                <tr>
                  <td colSpan="5">Sign in to view puppy data.</td>
                </tr>
              )}

              {/* show a message row when the user is signed in but has no puppies */}
              {auth?.isSignedIn && puppies.length === 0 && (
                <tr>
                  <td colSpan="5">No puppies found for this user.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="forms-section">
        <div className="forms-grid">
          <div className="form-card">
            <h3>Add New Puppy</h3>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Puppy Name"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  name="breed"
                  value={form.breed}
                  onChange={onChange}
                  placeholder="Breed"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder="Age"
                  required
                />
              </div>
              <button type="submit" className="btn-primary">Add Puppy</button>
            </form>
          </div>

          <div className="form-card">
            <h3>Delete Puppy</h3>
            <form onSubmit={onDelete}>
              <div className="form-group">
                <input
                  name="id"
                  value={form.id}
                  onChange={onChange}
                  placeholder="Puppy ID to delete"
                  required
                />
              </div>
              <button type="submit" className="btn-danger">Delete Puppy</button>
            </form>
          </div>

          <div className="form-card">
            <h3>Update Puppy</h3>
            <h4>Fill in ALL fields, not just the ones you want to update!</h4>
            <form onSubmit={onUpdate}>
              <div className="form-group">
                <input
                  name="id"
                  value={form.id}
                  onChange={onChange}
                  placeholder="Puppy ID to update"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="Name"
                />
              </div>
              <div className="form-group">
                <input
                  name="breed"
                  value={form.breed}
                  onChange={onChange}
                  placeholder="Breed"
                />
              </div>
              <div className="form-group">
                <input
                  name="age"
                  value={form.age}
                  onChange={onChange}
                  placeholder="Age"
                />
              </div>
              <button type="submit" className="btn-secondary">Update Puppy</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Body;
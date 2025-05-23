import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function RequireAuth({ children }) {
  const user = localStorage.getItem('user');

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

RequireAuth.propTypes = {
  children: PropTypes.node.isRequired,
};


import './PriceList.css'

function PriceList({ services = [] }) {
  const activeServices = services.filter(s => s.is_active)

  return (
    <div className="price-list card">
      <h3>Price List</h3>
      {activeServices.length === 0 ? (
        <p className="no-services">No services available</p>
      ) : (
        <table className="price-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Duration</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {activeServices.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.duration} min</td>
                <td>₹{item.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default PriceList

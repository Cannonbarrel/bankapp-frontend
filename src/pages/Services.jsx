import { serviceCards } from '../services/bankData'

function Services() {
  return (
    <section className="card page-panel reveal-up" aria-label="Services">
      <h1>Our Services</h1>
      <p className="muted">
        Explore personal and business solutions designed to keep your money moving.
      </p>
      <div className="info-grid">
        {serviceCards.map((service) => (
          <article className="info-tile" key={service.title}>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Services

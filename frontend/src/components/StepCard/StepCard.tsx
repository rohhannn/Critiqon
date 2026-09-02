import './StepCard.css'

type StepCardProps = {
  number: string
  title: string
  description: string
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="step-card">
      <div className="step-number">{number}</div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  )
}

export default StepCard
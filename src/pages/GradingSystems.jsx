function GradingSystems() {
  return (
    <main className="page-container">

      <div className="page-header">
        <span className="page-badge">
          CONFIGURATION
        </span>

        <h1>
          Grading Systems
        </h1>

        <p>
          Create, customize and manage Fixed and Relative
          grading systems.
        </p>
      </div>

      <div className="grading-options">

        <div className="system-card">

          <div className="system-icon">
            📊
          </div>

          <h2>
            Fixed Grading
          </h2>

          <p>
            Create percentage-based grading rules with custom
            grades and grade points.
          </p>

          <button className="primary-btn">
            Create System
          </button>

        </div>


        <div className="system-card">

          <div className="system-icon">
            📈
          </div>

          <h2>
            Relative Grading
          </h2>

          <p>
            Configure relative grading rules and evaluation
            parameters.
          </p>

          <button className="primary-btn">
            Create System
          </button>

        </div>

      </div>

    </main>
  )
}

export default GradingSystems
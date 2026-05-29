import React from "react";

function MaintenancePage() {
  return (
    <main className="min-h-screen bg-surface text-on-surface flex items-center justify-center px-6">
      <section className="w-full max-w-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <span className="material-symbols-outlined text-4xl">construction</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600">
            Website đang bảo trì
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            Hệ thống đang được nâng cấp để phục vụ tốt hơn. Vui lòng quay lại sau.
          </p>
        </div>
      </section>
    </main>
  );
}

export default MaintenancePage;

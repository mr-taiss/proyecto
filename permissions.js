/* SISGOP - permisos de propietario de objetos */
(function () {
  const OBJECTS_KEY = "sisgop_objects";
  const SESSION_KEY = "sisgop_current_user";

  function readObjects() {
    try {
      const data = JSON.parse(localStorage.getItem(OBJECTS_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function currentUserName() {
    return String(localStorage.getItem(SESSION_KEY) || "").trim();
  }

  function ownerCanModify(id) {
    const user = currentUserName();
    if (!user) {
      if (typeof window.showSISGOPLogin === "function") window.showSISGOPLogin();
      return false;
    }
    const object = readObjects().find(item => String(item.id) === String(id));
    if (!object || object.owner !== user) {
      alert("Solo el estudiante que registró este objeto puede modificarlo.");
      return false;
    }
    return true;
  }

  function protectAction(name) {
    const original = window[name];
    if (typeof original !== "function" || original.__sisgopOwnerProtected) return;
    const wrapped = function (id) {
      if (!ownerCanModify(id)) return;
      return original.apply(this, arguments);
    };
    wrapped.__sisgopOwnerProtected = true;
    window[name] = wrapped;
  }

  function assignOwnerToNewObject(beforeIds) {
    const user = currentUserName();
    if (!user) return;
    const data = readObjects();
    const created = data.filter(item => !beforeIds.has(String(item.id)));
    if (!created.length) return;
    const newest = created[created.length - 1];
    if (!newest.owner) {
      newest.owner = user;
      localStorage.setItem(OBJECTS_KEY, JSON.stringify(data));
    }
  }

  function install() {
    ["editObject", "deleteObject", "markFound", "markRecovered"].forEach(protectAction);

    const form = document.getElementById("objectForm");
    if (form && !form.dataset.sisgopOwnerTracking) {
      form.dataset.sisgopOwnerTracking = "1";
      form.addEventListener("submit", function () {
        const beforeIds = new Set(readObjects().map(item => String(item.id)));
        setTimeout(() => assignOwnerToNewObject(beforeIds), 0);
      });
    }
  }

  window.sisgopOwnerCanModify = ownerCanModify;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 100);
  setTimeout(install, 500);
})();

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// PERBAIKAN IMPORT PDF: Menggunakan penulisan import yang kompatibel dengan Vite
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  LogOut,
  X,
  BookOpen,
  Users,
  GraduationCap,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Save,
  Menu,
  FileText, // Icon untuk tombol PDF
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const DashboardPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("registration");

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [adminName, setAdminName] = useState("Admin");
  const [adminPhoto, setAdminPhoto] = useState(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("foto");
    localStorage.removeItem("id_admin");
    navigate("/LoginAdmin");
  };

  const [registrations, setRegistrations] = useState([]);
  const [excurOptions, setExcurOptions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const regRes = await fetch(`${API_BASE_URL}/api/registrations`, {
        headers,
      });
      if (regRes.status === 401) {
        handleLogout();
        return;
      }

      const regData = await regRes.json();
      setRegistrations(regData);

      const excurRes = await fetch(
        `${API_BASE_URL}/api/extracurricularnolquota`,
        { headers },
      );
      const excurData = await excurRes.json();
      setExcurOptions(excurData);

      const teacherRes = await fetch(`${API_BASE_URL}/api/pengajar`, {
        headers,
      });
      const teacherData = await teacherRes.json();
      setTeachers(teacherData);

      const studentRes = await fetch(`${API_BASE_URL}/api/students`, {
        headers,
      });
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudents(studentData);
      }

      const settingsRes = await fetch(`${API_BASE_URL}/api/settings`, {
        headers,
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        const formatDateTime = (isoStr) => (isoStr ? isoStr.slice(0, 16) : "");
        setRegSettings({
          selection_start: formatDateTime(settingsData.selection_start),
          selection_end: formatDateTime(settingsData.selection_end),
          direct_start: formatDateTime(settingsData.direct_start),
          direct_end: formatDateTime(settingsData.direct_end),
        });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyTokenAndLoad = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/LoginAdmin");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/check-token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (data.status === "true") {
          const storedName = localStorage.getItem("username");
          const storedPhoto = localStorage.getItem("foto");
          if (storedName) setAdminName(storedName);
          if (storedPhoto) setAdminPhoto(`${API_BASE_URL}${storedPhoto}`);
          fetchData();
        } else if (data.status === "expire") {
          alert("Sesi login Anda telah berakhir. Silakan login kembali.");
          handleLogout();
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error("Gagal verifikasi token:", error);
        handleLogout();
      } finally {
        setIsAuthChecking(false);
      }
    };
    verifyTokenAndLoad();
  }, [navigate]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const idAdmin = localStorage.getItem("id_admin");
    const token = localStorage.getItem("token");

    const formData = new FormData();
    if (profileUsername) formData.append("username", profileUsername);
    if (profilePassword) formData.append("password", profilePassword);
    if (profilePhotoFile) formData.append("foto", profilePhotoFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admins/${idAdmin}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("username", data.username);
        setAdminName(data.username);

        if (data.foto) {
          localStorage.setItem("foto", data.foto);
          setAdminPhoto(`${API_BASE_URL}${data.foto}`);
        }

        setIsProfileModalOpen(false);
        setIsSuccessModalOpen(true);
        setProfilePassword("");

        if (profilePassword) {
          alert(
            "Password berhasil diubah! Silakan login kembali demi keamanan.",
          );
          handleLogout();
        }
      } else {
        const errData = await response.json();
        alert(`Gagal memperbarui profil: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [searchName, setSearchName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterExcur, setFilterExcur] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchExcurName, setSearchExcurName] = useState("");
  const [searchTeacherName, setSearchTeacherName] = useState("");
  const [searchStudentName, setSearchStudentName] = useState("");
  const [filterStudentClass, setFilterStudentClass] = useState("");
  const [sortClassOrder, setSortClassOrder] = useState("asc");

  const [regCurrentPage, setRegCurrentPage] = useState(1);
  const [excurCurrentPage, setExcurCurrentPage] = useState(1);
  const [teacherCurrentPage, setTeacherCurrentPage] = useState(1);
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(
    () => setRegCurrentPage(1),
    [searchName, filterGrade, filterExcur, filterStatus, sortClassOrder],
  );
  useEffect(() => setExcurCurrentPage(1), [searchExcurName]);
  useEffect(() => setTeacherCurrentPage(1), [searchTeacherName]);
  useEffect(
    () => setStudentCurrentPage(1),
    [searchStudentName, filterStudentClass],
  );

  const filteredData = registrations.filter((item) => {
    const matchName = item.student_name
      .toLowerCase()
      .includes(searchName.toLowerCase());
    const matchExcur = filterExcur === "" || item.excur_name === filterExcur;
    const matchGrade =
      filterGrade === "" ||
      (item.student_class && item.student_class.startsWith(filterGrade));
    const matchStatus = filterStatus === "" || item.status === filterStatus;
    return matchName && matchExcur && matchGrade && matchStatus;
  });

  const processedRegData = [...filteredData].sort((a, b) => {
    const classA = a.student_class || "";
    const classB = b.student_class || "";
    return sortClassOrder === "asc"
      ? classA.localeCompare(classB)
      : classB.localeCompare(classA);
  });

  const filteredExcurList = excurOptions.filter((item) =>
    item.excur_name.toLowerCase().includes(searchExcurName.toLowerCase()),
  );

  const filteredTeacherList = teachers.filter((item) =>
    item.nama_pengajar.toLowerCase().includes(searchTeacherName.toLowerCase()),
  );

  const filteredStudentList = students.filter((item) => {
    const matchName = item.student_name
      .toLowerCase()
      .includes(searchStudentName.toLowerCase());
    const matchClass =
      filterStudentClass === "" ||
      (item.kelas &&
        item.kelas.toLowerCase().includes(filterStudentClass.toLowerCase()));
    return matchName && matchClass;
  });

  const indexOfLastReg = regCurrentPage * itemsPerPage;
  const indexOfFirstReg = indexOfLastReg - itemsPerPage;
  const currentRegs = processedRegData.slice(indexOfFirstReg, indexOfLastReg);
  const totalRegPages = Math.ceil(processedRegData.length / itemsPerPage);

  const indexOfLastExcur = excurCurrentPage * itemsPerPage;
  const indexOfFirstExcur = indexOfLastExcur - itemsPerPage;
  const currentExcurs = filteredExcurList.slice(
    indexOfFirstExcur,
    indexOfLastExcur,
  );
  const totalExcurPages = Math.ceil(filteredExcurList.length / itemsPerPage);

  const indexOfLastTeacher = teacherCurrentPage * itemsPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - itemsPerPage;
  const currentTeachers = filteredTeacherList.slice(
    indexOfFirstTeacher,
    indexOfLastTeacher,
  );
  const totalTeacherPages = Math.ceil(
    filteredTeacherList.length / itemsPerPage,
  );

  const indexOfLastStudent = studentCurrentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = filteredStudentList.slice(
    indexOfFirstStudent,
    indexOfLastStudent,
  );
  const totalStudentPages = Math.ceil(
    filteredStudentList.length / itemsPerPage,
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({
    no_register: "",
    student_name: "",
    id_excur: "",
    status: "",
    selection_date: "",
    place: "",
  });

  const [isExcurModalOpen, setIsExcurModalOpen] = useState(false);
  const [excurModalMode, setExcurModalMode] = useState("add");
  const [excurFormData, setExcurFormData] = useState({
    id_excur: "",
    excur_name: "",
    kuota: "",
    selection_date: "",
    place: "",
  });

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherModalMode, setTeacherModalMode] = useState("add");
  const [teacherFormData, setTeacherFormData] = useState({
    id_pengajar: "",
    nama_pengajar: "",
    id_excur: "",
  });

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState("add");
  const [studentFormData, setStudentFormData] = useState({
    id_students: "",
    student_name: "",
    kelas: "",
  });
  const [bulkStudentText, setBulkStudentText] = useState("");

  const [regSettings, setRegSettings] = useState({
    selection_start: "",
    selection_end: "",
    direct_start: "",
    direct_end: "",
  });

  const submitSettings = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        selection_start: regSettings.selection_start
          ? new Date(regSettings.selection_start).toISOString()
          : null,
        selection_end: regSettings.selection_end
          ? new Date(regSettings.selection_end).toISOString()
          : null,
        direct_start: regSettings.direct_start
          ? new Date(regSettings.direct_start).toISOString()
          : null,
        direct_end: regSettings.direct_end
          ? new Date(regSettings.direct_end).toISOString()
          : null,
      };

      const response = await fetch(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setIsSuccessModalOpen(true);
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Failed to update settings: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (row) => {
    const currentExcur = excurOptions.find(
      (ex) => ex.excur_name === row.excur_name,
    );
    setEditData({
      no_register: row.no_register,
      student_name: row.student_name,
      id_excur: currentExcur ? currentExcur.id_excur : "",
      status: row.status || "Pending Selection",
      selection_date: row.selection_date || "",
      place: row.place || "",
    });
    setIsEditModalOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        id_excur: parseInt(editData.id_excur),
        status: editData.status,
        selection_date: editData.selection_date || null,
        place: editData.place || null,
      };
      const response = await fetch(
        `${API_BASE_URL}/api/register/${editData.no_register}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setIsEditModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Failed to update: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error updating data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noReg) => {
    const isConfirm = window.confirm(
      `Apakah Anda yakin ingin menghapus data ${noReg}? Kuota ekskul akan dikembalikan.`,
    );
    if (!isConfirm) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/api/register/${noReg}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        alert("Data berhasil dihapus!");
        setRegistrations(
          registrations.filter((item) => item.no_register !== noReg),
        );
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleAddExcurClick = () => {
    setExcurModalMode("add");
    setExcurFormData({
      id_excur: "",
      excur_name: "",
      kuota: "",
      selection_date: "",
      place: "",
    });
    setIsExcurModalOpen(true);
  };

  const handleExcurEditClick = (row) => {
    setExcurModalMode("edit");
    setExcurFormData({
      id_excur: row.id_excur,
      excur_name: row.excur_name,
      kuota: row.kuota,
      selection_date: row.selection_date || "",
      place: row.place || "",
    });
    setIsExcurModalOpen(true);
  };

  const submitExcurForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        excur_name: excurFormData.excur_name,
        kuota: parseInt(excurFormData.kuota),
        selection_date: excurFormData.selection_date || null,
        place: excurFormData.place || null,
      };

      let response;
      if (excurModalMode === "add") {
        response = await fetch(`${API_BASE_URL}/api/extracurricular`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/extracurricular/${excurFormData.id_excur}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      }

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setIsExcurModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Failed to save extracurricular: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error saving extracurricular:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcurDelete = async (idExcur, excurName) => {
    const isConfirm = window.confirm(
      `PERINGATAN: Yakin ingin menghapus ekstrakurikuler "${excurName}"?\n(Gagal jika masih ada siswa yang mendaftar)`,
    );
    if (!isConfirm) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/extracurricular/${idExcur}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        alert("Ekstrakurikuler berhasil dihapus!");
        setExcurOptions(
          excurOptions.filter((item) => item.id_excur !== idExcur),
        );
      } else {
        const errData = await response.json();
        alert(`Gagal menghapus: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting extracurricular:", error);
    }
  };

  const handleAddTeacherClick = () => {
    setTeacherModalMode("add");
    setTeacherFormData({ id_pengajar: "", nama_pengajar: "", id_excur: "" });
    setIsTeacherModalOpen(true);
  };

  const handleEditTeacherClick = (row) => {
    setTeacherModalMode("edit");
    setTeacherFormData({
      id_pengajar: row.id_pengajar,
      nama_pengajar: row.nama_pengajar,
      id_excur: row.id_excur || "",
    });
    setIsTeacherModalOpen(true);
  };

  const submitTeacherForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const payload = {
        nama_pengajar: teacherFormData.nama_pengajar,
        id_excur: teacherFormData.id_excur
          ? parseInt(teacherFormData.id_excur)
          : null,
      };
      let response;
      if (teacherModalMode === "add") {
        response = await fetch(`${API_BASE_URL}/api/pengajar`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/pengajar/${teacherFormData.id_pengajar}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      }

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setIsTeacherModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Failed to save teacher: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error saving teacher:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (idPengajar, teacherName) => {
    const isConfirm = window.confirm(
      `Apakah Anda yakin ingin menghapus data pengajar "${teacherName}"?`,
    );
    if (!isConfirm) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/pengajar/${idPengajar}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        alert("Data pengajar berhasil dihapus!");
        setTeachers(teachers.filter((item) => item.id_pengajar !== idPengajar));
      } else {
        const errData = await response.json();
        alert(`Gagal menghapus: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
    }
  };

  const handleAddStudentClick = () => {
    setStudentModalMode("add");
    setStudentFormData({ id_students: "", student_name: "", kelas: "" });
    setIsStudentModalOpen(true);
  };

  const handleBulkStudentClick = () => {
    setStudentModalMode("bulk");
    setBulkStudentText(
      '[\n  {"student_name": "John Doe", "kelas": "3A"},\n  {"student_name": "Jane Smith", "kelas": "4B"}\n]',
    );
    setIsStudentModalOpen(true);
  };

  const handleEditStudentClick = (row) => {
    setStudentModalMode("edit");
    setStudentFormData({
      id_students: row.id_students,
      student_name: row.student_name,
      kelas: row.kelas,
    });
    setIsStudentModalOpen(true);
  };

  const submitStudentForm = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      let response;
      if (studentModalMode === "bulk") {
        let payload;
        try {
          payload = JSON.parse(bulkStudentText);
          if (!Array.isArray(payload)) throw new Error("Must be a JSON Array");
        } catch (jsonErr) {
          alert(
            "Invalid JSON format! Please double-check your bulk payload text.",
          );
          setIsSubmitting(false);
          return;
        }

        response = await fetch(`${API_BASE_URL}/api/students/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (studentModalMode === "add") {
        const payload = {
          student_name: studentFormData.student_name,
          kelas: studentFormData.kelas,
        };
        response = await fetch(`${API_BASE_URL}/api/students`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        const payload = {
          student_name: studentFormData.student_name,
          kelas: studentFormData.kelas,
        };
        response = await fetch(
          `${API_BASE_URL}/api/students/${studentFormData.id_students}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          },
        );
      }

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        setIsStudentModalOpen(false);
        setIsSuccessModalOpen(true);
        fetchData();
      } else {
        const errData = await response.json();
        alert(`Failed to save student: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (idStudents, studentName) => {
    const isConfirm = window.confirm(
      `Apakah Anda yakin ingin menghapus data siswa "${studentName}"?`,
    );
    if (!isConfirm) return;
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/students/${idStudents}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.ok) {
        alert("Data siswa berhasil dihapus!");
        setStudents(students.filter((item) => item.id_students !== idStudents));
      } else {
        const errData = await response.json();
        alert(`Gagal menghapus: ${errData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  };

  // ==========================================
  // UPDATE ABSENSI EXCEL: Khusus Mendownload Status "Accepted"
  // ==========================================
  const handleDownloadExcel = async () => {
    const acceptedData = processedRegData.filter(
      (item) => item.status === "Accepted",
    );

    if (acceptedData.length === 0) {
      alert("Tidak ada data dengan status 'Accepted' untuk diunduh.");
      return;
    }

    const excurName = filterExcur || "SEMUA EKSTRAKURIKULER";
    const teacherNameStr = acceptedData[0]?.nama_pengajar || "-";
    const teachersListStr = teacherNameStr
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (teachersListStr.length === 0) teachersListStr.push("-");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Absensi Siswa");

    worksheet.columns = [
      { key: "no", width: 5 },
      { key: "name", width: 30 },
      ...Array.from({ length: 15 }).map((_, i) => ({
        key: `w${i + 1}`,
        width: 10,
      })),
    ];

    worksheet.mergeCells("A1:Q1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `ABSENSI EXTRACURRICULLER ${excurName.toUpperCase()}`;
    titleCell.font = { name: "Arial", size: 14, bold: true };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:Q2");
    const yearCell = worksheet.getCell("A2");
    yearCell.value = "2026/2027";
    yearCell.font = { name: "Arial", size: 12, bold: true };
    yearCell.alignment = { vertical: "middle", horizontal: "center" };

    let currentRow = 3;
    teachersListStr.forEach((teacher) => {
      const teacherLabel = worksheet.getCell(`B${currentRow}`);
      teacherLabel.value = "Teachers :";
      teacherLabel.alignment = { vertical: "middle", horizontal: "left" };

      const teacherValue = worksheet.getCell(`E${currentRow}`);
      teacherValue.value = teacher;
      teacherValue.alignment = { vertical: "middle", horizontal: "left" };

      currentRow++;
    });

    const headerRow = worksheet.getRow(currentRow);
    headerRow.values = [
      "No",
      "Students Name",
      ...Array.from({ length: 15 }).map((_, i) => `Week ${i + 1}`),
    ];
    headerRow.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    currentRow++;

    acceptedData.forEach((item, index) => {
      const rowValues = [
        index + 1,
        item.student_name,
        ...Array.from({ length: 15 }).map(() => ""),
      ];
      const row = worksheet.getRow(currentRow);
      row.values = rowValues;
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      currentRow++;
    });

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = filterExcur
        ? `Absensi_${filterExcur}.xlsx`
        : "Data_Semua_Absensi.xlsx";
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);
    } catch (error) {
      console.error("Gagal mendownload Excel:", error);
      alert("Terjadi kesalahan saat membuat file Excel.");
    }
  };

  // ==========================================
  // UPDATE SELECTION PDF: Tanpa tanda [], Plus Tanggal dari DB
  // ==========================================
  const handleDownloadPDF = () => {
    const pendingData = processedRegData.filter(
      (item) => item.status === "Pending Selection",
    );

    if (pendingData.length === 0) {
      alert("Tidak ada data dengan status 'Pending Selection' untuk diunduh.");
      return;
    }

    const doc = new jsPDF();
    const excurName = filterExcur || "ALL EXTRACURRICULARS";

    // Menarik data tanggal seleksi milik siswa dari database
    const dbSelDate =
      pendingData[0]?.selection_date || "________________________________";

    // Header PDF (Tanpa tanda kurung siku [])
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `EXTRACURRICULAR SELECTION FORM: ${excurName.toUpperCase()}`,
      14,
      20,
    );

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Teacher / Selector Name : ________________________________",
      14,
      28,
    );
    doc.text(`Date of Selection       : ${dbSelDate}`, 14, 34);

    const tableColumn = [
      "No.",
      "Registration Number",
      "Student Name",
      "Accept",
      "Reject",
      "Notes (Optional)",
    ];
    const tableRows = [];

    pendingData.forEach((item, index) => {
      const rowData = [
        index + 1,
        item.no_register,
        item.student_name,
        "[   ]",
        "[   ]",
        "",
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      startY: 42,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [29, 60, 106],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 15, halign: "center" },
        1: { cellWidth: 45 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 40 },
      },
    });

    const safeExcurName = excurName.replace(/\s+/g, "_");
    doc.save(`Selection_Form_${safeExcurName}.pdf`);
  };

  const getStatusBadge = (status) => {
    if (status === "Accepted")
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
          Accepted
        </span>
      );
    if (status === "Pending Selection")
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200">
          Pending
        </span>
      );
    return (
      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
        {status}
      </span>
    );
  };

  const renderPagination = (
    currentPage,
    totalPages,
    totalItems,
    setPageFn,
    indexOfFirstItem,
    currentItemsCount,
  ) => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <span className="text-sm text-slate-500 font-medium text-center sm:text-left">
          Showing{" "}
          <span className="font-bold text-slate-700">
            {totalItems === 0 ? 0 : indexOfFirstItem + 1}
          </span>{" "}
          to{" "}
          <span className="font-bold text-slate-700">
            {indexOfFirstItem + currentItemsCount}
          </span>{" "}
          of <span className="font-bold text-slate-700">{totalItems}</span>{" "}
          entries
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageFn(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-slate-600 px-2">
            Page {currentPage} of {totalPages === 0 ? 1 : totalPages}
          </span>
          <button
            onClick={() => setPageFn(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    );
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#eef3f8] flex flex-col items-center justify-center">
        <svg
          className="animate-spin h-12 w-12 text-[#1d3c6a] mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="text-[#1d3c6a] font-bold animate-pulse text-lg">
          Memuat Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-[#eef3f8] font-sans text-[#0f172a] relative">
      {/* ================= MOBILE HEADER ================= */}
      <div className="md:hidden flex items-center justify-between bg-white px-6 py-4 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#e3f2fd] flex items-center justify-center overflow-hidden border-2 border-[#1d3c6a]">
            {adminPhoto ? (
              <img
                src={adminPhoto}
                alt="Admin"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-extrabold text-[#38aef0] uppercase">
                {adminName.charAt(0)}
              </span>
            )}
          </div>
          <h2 className="font-extrabold text-[#1d3c6a] text-lg">Portal</h2>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 bg-slate-50 text-[#1d3c6a] rounded-lg border border-slate-200"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* ================= OVERLAY MOBILE SIDEBAR ================= */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-[1px_0_20px_rgb(0,0,0,0.03)] flex flex-col rounded-r-[2rem] transform transition-all duration-300 ease-in-out
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          md:relative md:translate-x-0
          ${isSidebarMinimized ? "w-24" : "w-72"}
        `}
      >
        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          className="hidden md:flex absolute -right-3.5 top-12 bg-white border border-slate-200 rounded-full p-1.5 shadow-md text-slate-500 hover:text-[#1d3c6a] hover:bg-slate-50 z-50 transition-colors"
        >
          {isSidebarMinimized ? (
            <ChevronRight size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>

        <div
          className={`p-8 flex flex-col items-center border-b border-slate-100 ${isSidebarMinimized ? "px-2" : ""}`}
        >
          <button
            className="md:hidden absolute top-4 right-4 text-slate-400 hover:text-red-500"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <X size={24} />
          </button>

          <div
            className={`${isSidebarMinimized ? "w-12 h-12 mb-2" : "w-24 h-24 mb-4"} rounded-full bg-[#e3f2fd] border-4 border-white shadow-md flex items-center justify-center overflow-hidden transition-all duration-300`}
          >
            {adminPhoto ? (
              <img
                src={adminPhoto}
                alt="Admin Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className={`${isSidebarMinimized ? "text-xl" : "text-3xl"} font-extrabold text-[#38aef0] uppercase`}
              >
                {adminName.charAt(0)}
              </span>
            )}
          </div>

          {!isSidebarMinimized && (
            <>
              <h2 className="text-2xl font-extrabold text-[#1d3c6a] capitalize text-center truncate w-full">
                {adminName}
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">
                School Portal
              </p>
            </>
          )}

          <button
            onClick={() => {
              setProfileUsername(adminName);
              setIsProfileModalOpen(true);
            }}
            className={`mt-3 flex items-center justify-center gap-1 font-bold text-[#38aef0] hover:text-[#1d3c6a] transition-colors bg-blue-50 rounded-full
              ${isSidebarMinimized ? "p-2" : "px-3 py-1.5 text-xs"}
            `}
            title="Edit Profile"
          >
            <Edit size={isSidebarMinimized ? 16 : 12} />
            {!isSidebarMinimized && "Edit Profile"}
          </button>
        </div>

        <nav className="flex-1 p-4 md:p-6 space-y-2 overflow-y-auto overflow-x-hidden">
          {[
            { id: "registration", icon: Users, label: "Registrations" },
            { id: "settings", icon: CalendarDays, label: "Phase Settings" },
            { id: "students", icon: Users, label: "Students List" },
            {
              id: "extracurricular",
              icon: BookOpen,
              label: "Extracurriculars",
            },
            { id: "teachers", icon: GraduationCap, label: "Teachers" },
          ].map((item) => (
            <button
              key={item.id}
              title={item.label}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarMinimized ? "justify-center px-0" : "gap-4 px-6"} py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id
                  ? "bg-[#e3f2fd] text-[#1d3c6a]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-[#1d3c6a]"
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {!isSidebarMinimized && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 md:p-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center ${isSidebarMinimized ? "justify-center px-0" : "justify-center gap-2 px-6"} py-4 text-red-500 hover:bg-red-50 rounded-2xl font-bold transition-all`}
          >
            <LogOut size={20} className="shrink-0" />
            {!isSidebarMinimized && "Logout"}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 flex flex-col gap-6 md:gap-8 overflow-y-auto">
        {/* ================= TAB REGISTRATIONS ================= */}
        {activeTab === "registration" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3c6a] tracking-tight">
                  Registration Data
                </h1>
                <p className="text-sm sm:text-lg text-slate-500 font-medium mt-1">
                  Manage extracurricular registrations and selections.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <button
                  onClick={handleDownloadExcel}
                  className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-green-600/30 transition-all flex items-center gap-2"
                >
                  <Download size={20} /> Absensi (Excel)
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto justify-center bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <FileText size={20} /> Extracurricular Selection
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col gap-4 md:gap-6">
              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] focus:bg-white transition-all font-medium text-slate-700"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Filter size={14} /> Filter Grade
                  </label>
                  <select
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="">All Grades</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Filter size={14} /> Filter Excur
                  </label>
                  <select
                    value={filterExcur}
                    onChange={(e) => setFilterExcur(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium cursor-pointer truncate"
                  >
                    <option value="">All Extracurriculars</option>
                    {excurOptions.map((excur) => (
                      <option key={excur.id_excur} value={excur.excur_name}>
                        {excur.excur_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <Filter size={14} /> Filter Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Pending Selection">Pending Selection</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                  <thead>
                    <tr className="bg-[#1d3c6a] text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold rounded-tl-[2rem]">
                        No
                      </th>
                      <th className="px-6 py-4 font-bold">Reg Number</th>
                      <th className="px-6 py-4 font-bold">Name</th>
                      <th
                        className="px-6 py-4 font-bold cursor-pointer hover:bg-[#152c4f] transition-colors group select-none"
                        onClick={() =>
                          setSortClassOrder((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          Class
                          <ArrowUpDown
                            size={14}
                            className="opacity-50 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-4 font-bold">Extracurricular</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Selection Date</th>
                      <th className="px-6 py-4 font-bold">Place</th>
                      <th className="px-6 py-4 font-bold rounded-tr-[2rem] text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center py-10 text-slate-500"
                        >
                          Loading data...
                        </td>
                      </tr>
                    ) : currentRegs.length === 0 ? (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center py-10 text-slate-500"
                        >
                          No registration data found.
                        </td>
                      </tr>
                    ) : (
                      currentRegs.map((row, index) => (
                        <tr
                          key={row.no_register}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 font-bold text-slate-400">
                            {indexOfFirstReg + index + 1}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                            {row.no_register}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1d3c6a] uppercase">
                            {row.student_name}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-700">
                            {row.student_class || "-"}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#38aef0]">
                            {row.excur_name}
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(row.status)}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {row.selection_date || "-"}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {row.place || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditClick(row)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(row.no_register)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading &&
                renderPagination(
                  regCurrentPage,
                  totalRegPages,
                  processedRegData.length,
                  setRegCurrentPage,
                  indexOfFirstReg,
                  currentRegs.length,
                )}
            </div>
          </div>
        )}

        {/* ================= TAB SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6 md:gap-8 max-w-4xl">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3c6a] tracking-tight">
                Registration Phase Settings
              </h1>
              <p className="text-sm sm:text-lg text-slate-500 font-medium mt-1">
                Manage the active dates for Selection and Direct Entry phases.
              </p>
            </div>

            <div className="bg-white rounded-[2rem] p-4 md:p-8 shadow-sm border border-slate-100">
              <form
                onSubmit={submitSettings}
                className="space-y-6 md:space-y-8"
              >
                <div className="bg-blue-50/50 p-4 md:p-6 rounded-2xl border border-blue-100">
                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-[#1d3c6a] mb-1">
                      Selection Phase
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500">
                      Set the timeline for extracurriculars that require
                      selection.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Selection Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={regSettings.selection_start}
                        onChange={(e) =>
                          setRegSettings({
                            ...regSettings,
                            selection_start: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Selection End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={regSettings.selection_end}
                        onChange={(e) =>
                          setRegSettings({
                            ...regSettings,
                            selection_end: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50/50 p-4 md:p-6 rounded-2xl border border-green-100">
                  <div className="mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-[#1d3c6a] mb-1">
                      Direct Entry Phase
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500">
                      Set the timeline for extracurriculars that do not require
                      selection.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Direct Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={regSettings.direct_start}
                        onChange={(e) =>
                          setRegSettings({
                            ...regSettings,
                            direct_start: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Direct End Date
                      </label>
                      <input
                        type="datetime-local"
                        value={regSettings.direct_end}
                        onChange={(e) =>
                          setRegSettings({
                            ...regSettings,
                            direct_end: e.target.value,
                          })
                        }
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0] text-slate-700 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto justify-center bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold py-3.5 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />{" "}
                    {isSubmitting ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB STUDENTS ================= */}
        {activeTab === "students" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3c6a] tracking-tight">
                  Students Management
                </h1>
                <p className="text-sm sm:text-lg text-slate-500 font-medium mt-1">
                  Manage student profiles or import bulk records.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleBulkStudentClick}
                  className="w-full sm:w-auto justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus size={20} /> Bulk Import
                </button>
                <button
                  onClick={handleAddStudentClick}
                  className="w-full sm:w-auto justify-center bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <Plus size={20} /> Add Student
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search student by name..."
                    value={searchStudentName}
                    onChange={(e) => setSearchStudentName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
                <div className="relative">
                  <Search
                    className="absolute left-4 top-3.5 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Filter by Class (e.g. 1A, 2B)..."
                    value={filterStudentClass}
                    onChange={(e) => setFilterStudentClass(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                  <thead>
                    <tr className="bg-[#1d3c6a] text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold rounded-tl-[2rem]">
                        No
                      </th>
                      <th className="px-6 py-4 font-bold">Student Name</th>
                      <th className="px-6 py-4 font-bold">
                        Class Name (Kelas)
                      </th>
                      <th className="px-6 py-4 font-bold rounded-tr-[2rem] text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10">
                          Loading...
                        </td>
                      </tr>
                    ) : currentStudents.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10">
                          No data
                        </td>
                      </tr>
                    ) : (
                      currentStudents.map((row, index) => (
                        <tr
                          key={row.id_students}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4 font-bold text-slate-400">
                            {indexOfFirstStudent + index + 1}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1d3c6a] uppercase">
                            {row.student_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold border border-blue-200 text-xs">
                              {row.kelas}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditStudentClick(row)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteStudent(
                                    row.id_students,
                                    row.student_name,
                                  )
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading &&
                renderPagination(
                  studentCurrentPage,
                  totalStudentPages,
                  filteredStudentList.length,
                  setStudentCurrentPage,
                  indexOfFirstStudent,
                  currentStudents.length,
                )}
            </div>
          </div>
        )}

        {/* ================= TAB EXTRACURRICULAR ================= */}
        {activeTab === "extracurricular" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3c6a] tracking-tight">
                  Extracurricular List
                </h1>
                <p className="text-sm sm:text-lg text-slate-500 font-medium mt-1">
                  Manage extracurricular programs, quotas, and schedules.
                </p>
              </div>
              <button
                onClick={handleAddExcurClick}
                className="w-full sm:w-auto justify-center bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Add Program
              </button>
            </div>

            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search extracurricular by name..."
                  value={searchExcurName}
                  onChange={(e) => setSearchExcurName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0]"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                  <thead>
                    <tr className="bg-[#1d3c6a] text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold rounded-tl-[2rem]">
                        No
                      </th>
                      <th className="px-6 py-4 font-bold">Program Name</th>
                      <th className="px-6 py-4 font-bold text-center">
                        Quota Left
                      </th>
                      <th className="px-6 py-4 font-bold">Selection Date</th>
                      <th className="px-6 py-4 font-bold">Place</th>
                      <th className="px-6 py-4 font-bold rounded-tr-[2rem] text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10">
                          Loading...
                        </td>
                      </tr>
                    ) : currentExcurs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-10">
                          No data
                        </td>
                      </tr>
                    ) : (
                      currentExcurs.map((row, index) => (
                        <tr key={row.id_excur} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-400">
                            {indexOfFirstExcur + index + 1}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1d3c6a]">
                            {row.excur_name}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`px-3 py-1 rounded-full font-bold text-xs border ${row.kuota <= 0 ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200"}`}
                            >
                              {row.kuota}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {row.selection_date || "-"}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {row.place || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleExcurEditClick(row)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleExcurDelete(
                                    row.id_excur,
                                    row.excur_name,
                                  )
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading &&
                renderPagination(
                  excurCurrentPage,
                  totalExcurPages,
                  filteredExcurList.length,
                  setExcurCurrentPage,
                  indexOfFirstExcur,
                  currentExcurs.length,
                )}
            </div>
          </div>
        )}

        {/* ================= TAB TEACHERS ================= */}
        {activeTab === "teachers" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1d3c6a] tracking-tight">
                  Teachers List
                </h1>
                <p className="text-sm sm:text-lg text-slate-500 font-medium mt-1">
                  Manage teachers and assign them to extracurriculars.
                </p>
              </div>
              <button
                onClick={handleAddTeacherClick}
                className="w-full sm:w-auto justify-center bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Add Teacher
              </button>
            </div>

            <div className="bg-white rounded-[2rem] p-4 md:p-6 shadow-sm border border-slate-100">
              <div className="relative">
                <Search
                  className="absolute left-4 top-3.5 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search teacher by name..."
                  value={searchTeacherName}
                  onChange={(e) => setSearchTeacherName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#38aef0]"
                />
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                  <thead>
                    <tr className="bg-[#1d3c6a] text-white text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-bold rounded-tl-[2rem]">
                        No
                      </th>
                      <th className="px-6 py-4 font-bold">Teacher Name</th>
                      <th className="px-6 py-4 font-bold">
                        Assigned Program (Excur)
                      </th>
                      <th className="px-6 py-4 font-bold rounded-tr-[2rem] text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {isLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10">
                          Loading...
                        </td>
                      </tr>
                    ) : currentTeachers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10">
                          No data
                        </td>
                      </tr>
                    ) : (
                      currentTeachers.map((row, index) => (
                        <tr
                          key={row.id_pengajar}
                          className="hover:bg-slate-50/50"
                        >
                          <td className="px-6 py-4 font-bold text-slate-400">
                            {indexOfFirstTeacher + index + 1}
                          </td>
                          <td className="px-6 py-4 font-bold text-[#1d3c6a]">
                            {row.nama_pengajar}
                          </td>
                          <td className="px-6 py-4">
                            {row.excur_name ? (
                              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold border border-blue-200 text-xs">
                                {row.excur_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium italic">
                                - Unassigned -
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditTeacherClick(row)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTeacher(
                                    row.id_pengajar,
                                    row.nama_pengajar,
                                  )
                                }
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {!isLoading &&
                renderPagination(
                  teacherCurrentPage,
                  totalTeacherPages,
                  filteredTeacherList.length,
                  setTeacherCurrentPage,
                  indexOfFirstTeacher,
                  currentTeachers.length,
                )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* MODAL EDIT REGISTRATION */}
      {/* ========================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1d3c6a]">
                Edit Registration
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={submitEdit} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editData.student_name}
                  disabled
                  className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold uppercase cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Extracurricular
                </label>
                <select
                  value={editData.id_excur}
                  onChange={(e) =>
                    setEditData({ ...editData, id_excur: e.target.value })
                  }
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                >
                  <option value="">Select Extracurricular</option>
                  {excurOptions.map((excur) => (
                    <option
                      key={excur.id_excur}
                      value={excur.id_excur}
                      disabled={excur.kuota <= 0}
                    >
                      {excur.excur_name} {excur.kuota <= 0 ? "(Full)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Status
                </label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                >
                  <option value="Accepted">Accepted</option>
                  <option value="Pending Selection">Pending Selection</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Selection Date
                  </label>
                  <input
                    type="date"
                    value={editData.selection_date}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        selection_date: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Place
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 4A"
                    value={editData.place}
                    onChange={(e) =>
                      setEditData({ ...editData, place: e.target.value })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL ADD / EDIT EXTRACURRICULAR */}
      {/* ========================================== */}
      {isExcurModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1d3c6a]">
                {excurModalMode === "add" ? "Add New Program" : "Edit Program"}
              </h2>
              <button
                onClick={() => setIsExcurModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={submitExcurForm} className="space-y-4 md:space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  value={excurFormData.excur_name}
                  onChange={(e) =>
                    setExcurFormData({
                      ...excurFormData,
                      excur_name: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0] font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Total Quota
                </label>
                <input
                  type="number"
                  min="0"
                  value={excurFormData.kuota}
                  onChange={(e) =>
                    setExcurFormData({
                      ...excurFormData,
                      kuota: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Default Selection Date
                  </label>
                  <input
                    type="date"
                    value={excurFormData.selection_date}
                    onChange={(e) =>
                      setExcurFormData({
                        ...excurFormData,
                        selection_date: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    Default Place
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field"
                    value={excurFormData.place}
                    onChange={(e) =>
                      setExcurFormData({
                        ...excurFormData,
                        place: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                  />
                </div>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsExcurModalOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL ADD / EDIT TEACHER */}
      {/* ========================================== */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1d3c6a]">
                {teacherModalMode === "add"
                  ? "Add New Teacher"
                  : "Edit Teacher"}
              </h2>
              <button
                onClick={() => setIsTeacherModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={submitTeacherForm}
              className="space-y-4 md:space-y-5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Teacher Name
                </label>
                <input
                  type="text"
                  value={teacherFormData.nama_pengajar}
                  onChange={(e) =>
                    setTeacherFormData({
                      ...teacherFormData,
                      nama_pengajar: e.target.value,
                    })
                  }
                  required
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0] font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Assign to Extracurricular
                </label>
                <select
                  value={teacherFormData.id_excur}
                  onChange={(e) =>
                    setTeacherFormData({
                      ...teacherFormData,
                      id_excur: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                >
                  <option value="">- Unassigned (No Extracurricular) -</option>
                  {excurOptions.map((excur) => (
                    <option key={excur.id_excur} value={excur.id_excur}>
                      {excur.excur_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : teacherModalMode === "add"
                      ? "Add Teacher"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL ADD / EDIT / BULK STUDENTS */}
      {/* ========================================== */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1d3c6a]">
                {studentModalMode === "bulk"
                  ? "Bulk Import Students"
                  : studentModalMode === "add"
                    ? "Add New Student"
                    : "Edit Student"}
              </h2>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={submitStudentForm}
              className="space-y-4 md:space-y-5"
            >
              {studentModalMode === "bulk" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    JSON Payload Data (Array of Object)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Enter valid JSON structure utilizing "student_name" and
                    "kelas" parameters.
                  </p>
                  <textarea
                    rows="8"
                    value={bulkStudentText}
                    onChange={(e) => setBulkStudentText(e.target.value)}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#38aef0]"
                  ></textarea>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={studentFormData.student_name}
                      onChange={(e) =>
                        setStudentFormData({
                          ...studentFormData,
                          student_name: e.target.value,
                        })
                      }
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                      Class Name (Kelas)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 3A, 4B"
                      value={studentFormData.kelas}
                      onChange={(e) =>
                        setStudentFormData({
                          ...studentFormData,
                          kelas: e.target.value,
                        })
                      }
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                    />
                  </div>
                </>
              )}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL EDIT PROFIL ADMIN */}
      {/* ========================================== */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-[#1d3c6a]">
                Edit Profile
              </h2>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={handleProfileUpdate}
              className="space-y-4 md:space-y-5"
            >
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Username Baru
                </label>
                <input
                  type="text"
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0] font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Ganti Password (Opsional)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak diganti"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#38aef0]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Upload Foto Baru (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-blue-50 file:text-[#38aef0] hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-full sm:flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:flex-1 py-3 px-4 bg-[#1d3c6a] hover:bg-[#152c4f] text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL ANIMASI SUKSES GLOBAL */}
      {/* ========================================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-[bounceIn_0.5s_ease-out] text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg
                className="h-10 w-10 text-green-500 animate-[pulse_1.5s_ease-in-out_infinite]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
              Success!
            </h3>
            <p className="text-slate-500 text-sm mb-8">
              The data has been updated and synchronized successfully.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPortal;

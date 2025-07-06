import logo from '../../../assets/logos/shahtranj_logo_gold.png';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import LanguageSwitcher from '../../LanguageSwitcher'; // הוספת מתג השפות
import './InquiryForm.css';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLocation, useSearchParams } from 'react-router-dom';

const InquiryForm = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n לשליטה בשפה
  const [searchParams] = useSearchParams();

  // הגדרת שפה בהתחלה לפי פרמטר מה-URL או מה-localStorage
  useEffect(() => {
    const langFromUrl = searchParams.get('lang');
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (langFromUrl) {
      // אם יש פרמטר שפה ב-URL, השתמש בו
      i18n.changeLanguage(langFromUrl);
    } else if (savedLanguage && savedLanguage !== i18n.language) {
      // אחרת, השתמש בשפה השמורה
      i18n.changeLanguage(savedLanguage);
    } else {
      // ברירת מחדל - ערבית (כמו ב-GuestPage)
      i18n.changeLanguage('ar');
    }
  }, [i18n, searchParams]);

  const applicantTypeParam = searchParams.get('applicantType') || '';
  const eventNameParam = searchParams.get('eventName') || '';

  const [form, setForm] = useState({
    applicantType: applicantTypeParam,
    courseName: applicantTypeParam === 'course' ? eventNameParam : '',
    tournamentName: applicantTypeParam === 'tournament' ? eventNameParam : '',
    studentName: '',
    parentContact: '',
    parentEmail: '',
    age: '',
    chessLevel: '',
    notes: '',
    studentSchool: '',
    college: '',
    major: '',
    uniYear: '',
    lastJob: '',
    chessLevelStars: '',
    availableDays: '',
    availableFrom: '',
    availableTo: '',
    mentoringExp: '',
    hasCar: '',
  });

  const [cvFile, setCvFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [courses, setCourses] = useState([]);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEvents = eventsSnapshot.docs.map(doc => doc.data());

      setCourses(allEvents.filter(e => e.type === 'course').map(e => e.title));
      setTournaments(allEvents.filter(e => e.type === 'tournament').map(e => e.title));
    };
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let cvURL = '';
      if (cvFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `cv-files/${Date.now()}_${cvFile.name}`);
        await uploadBytes(storageRef, cvFile);
        cvURL = await getDownloadURL(storageRef);
      }

      let dataToSend = {
        applicantType: form.applicantType,
        status: 'PENDING',
        submittedAt: Timestamp.now(),
      };

      switch (form.applicantType) {
        case 'individual':
          dataToSend = {
            ...dataToSend,
            studentName: form.studentName,
            age: form.age,
            phone: form.parentContact,
            email: form.parentEmail,
            tournamentName: form.tournamentName,
            chessLevel: form.chessLevel,
            notes: form.notes
          };
          break;

        case 'tournament':
          dataToSend = {
            ...dataToSend,
            participantName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            notes: form.notes
          };
          break;

        case 'course':
          dataToSend = {
            ...dataToSend,
            studentName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            courseName: form.courseName,
            notes: form.notes
          };
          break;

        case 'parent':
          dataToSend = {
            ...dataToSend,
            parentName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            notes: form.notes
          };
          break;

        case 'school':
          dataToSend = {
            ...dataToSend,
            schoolName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            notes: form.notes
          };
          break;

        case 'institution':
          dataToSend = {
            ...dataToSend,
            institutionName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            notes: form.notes
          };
          break;

        case 'coach':
          dataToSend = {
            ...dataToSend,
            fullName: form.studentName,
            phone: form.parentContact,
            email: form.parentEmail,
            city: form.city,
            college: form.college,
            major: form.major,
            uniYear: form.uniYear,
            lastJob: form.lastJob,
            age: form.age,
            chessLevelStars: form.chessLevelStars,
            availableDays: form.availableDays,
            availableFrom: form.availableFrom,
            availableTo: form.availableTo,
            mentoringExp: form.mentoringExp,
            hasCar: form.hasCar,
            notes: form.notes,
            cvURL: cvURL || ''
          };
          break;

        default:
          break;
      }

      await addDoc(collection(db, 'registrationForm'), dataToSend);
      setSubmitted(true);
      setForm({
        applicantType: '',
        studentName: '',
        parentContact: '',
        parentEmail: '',
        age: '',
        chessLevel: '',
        notes: '',
        studentSchool: '',
        college: '',
        major: '',
        uniYear: '',
        lastJob: '',
        chessLevelStars: '',
        availableDays: '',
        availableFrom: '',
        availableTo: '',
        mentoringExp: '',
        hasCar: '',
        courseName: '',
      });
      setCvFile(null);
    } catch (error) {
      console.error(error);
      alert(t('inquiryForm.submitError'));
    }
  };

  return (
    <div className="inquiry-form-section" id="join">
      {/* הוספת מתג השפות */}
      <div className="inquiry-language-switcher">
        <LanguageSwitcher />
      </div>

      <div className="join-logo-wrapper">
        <img src={logo} alt="Shah2Range Logo" className="join-logo" />
      </div>

      <h2 className="inquiry-form-title">{t('inquiryForm.title')}</h2>
      <form onSubmit={handleSubmit} className="inquiry-form">

        <label>
          {t('inquiryForm.applyingAs')}
          <select name="applicantType" value={form.applicantType} onChange={handleChange} required>
            <option value="">{t('inquiryForm.select')}</option>
            <option value="individual">{t('inquiryForm.applicantTypes.individual')}</option>
            <option value="tournament">{t('inquiryForm.applicantTypes.tournament')}</option>
            <option value="course">{t('inquiryForm.applicantTypes.course')}</option>
            <option value="parent">{t('inquiryForm.applicantTypes.parent')}</option>
            <option value="school">{t('inquiryForm.applicantTypes.school')}</option>
            <option value="institution">{t('inquiryForm.applicantTypes.institution')}</option>
            <option value="coach">{t('inquiryForm.applicantTypes.coach')}</option>
          </select>
        </label>

        {/* Dynamic Fields */}
        {form.applicantType === 'individual' && (
          <>
            <label>{t('inquiryForm.fullName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.age')}:<input type="number" name="age" value={form.age} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.chessLevel')}:
              <select name="chessLevel" value={form.chessLevel} onChange={handleChange} required>
                <option value="">{t('inquiryForm.select')}</option>
                <option value="beginner">{t('inquiryForm.chessLevels.beginner')}</option>
                <option value="intermediate">{t('inquiryForm.chessLevels.intermediate')}</option>
                <option value="advanced">{t('inquiryForm.chessLevels.advanced')}</option>
              </select>
            </label>
            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'tournament' && (
          <>
            <label>{t('inquiryForm.fullName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            
            <label>{t('inquiryForm.selectTournament')}:
              <select name="tournamentName" value={form.tournamentName} onChange={handleChange} required>
                <option value="">{t('inquiryForm.selectTournamentOption')}</option>
                {tournaments.map((title, index) => (
                  <option key={index} value={title}>{title}</option>
                ))}
              </select>
            </label>

            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'course' && (
          <>
            <label>{t('inquiryForm.fullName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.selectCourse')}:
              <select name="courseName" value={form.courseName} onChange={handleChange} required>
                <option value="">{t('inquiryForm.selectCourseOption')}</option>
                {courses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </select>
            </label>
            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'parent' && (
          <>
            <label>{t('inquiryForm.parentName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'school' && (
          <>
            <label>{t('inquiryForm.schoolName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'institution' && (
          <>
            <label>{t('inquiryForm.institutionName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.notesOptional')}:<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'coach' && (
          <>
            <label>{t('inquiryForm.fullName')}:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.phoneNumber')}:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.email')}:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.city')}:<input type="text" name="city" value={form.city} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.university')}:<input type="text" name="college" value={form.college} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.major')}:<input type="text" name="major" value={form.major} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.universityYear')}:<input type="text" name="uniYear" value={form.uniYear} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.lastJob')}:<input type="text" name="lastJob" value={form.lastJob} onChange={handleChange} /></label>
            <label>{t('inquiryForm.age')}:<input type="number" name="age" value={form.age} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.chessKnowledge')}:
              <select name="chessLevelStars" value={form.chessLevelStars} onChange={handleChange} required>
                <option value="">{t('inquiryForm.select')}</option>
                <option value="1">★☆☆☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="3">★★★☆☆</option>
                <option value="4">★★★★☆</option>
                <option value="5">★★★★★</option>
              </select>
            </label>
            <label>{t('inquiryForm.availableDays')}:<textarea name="availableDays" value={form.availableDays} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.availableFrom')}:<input type="time" name="availableFrom" value={form.availableFrom} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.availableTo')}:<input type="time" name="availableTo" value={form.availableTo} onChange={handleChange} required /></label>
            <label>{t('inquiryForm.mentoringExp')}:<textarea name="mentoringExp" value={form.mentoringExp} onChange={handleChange} /></label>
            <label>{t('inquiryForm.hasCar')}:
              <select name="hasCar" value={form.hasCar} onChange={handleChange} required>
                <option value="">{t('inquiryForm.select')}</option>
                <option value="Yes">{t('inquiryForm.yes')}</option>
                <option value="No">{t('inquiryForm.no')}</option>
              </select>
            </label>
            <label>{t('inquiryForm.uploadCv')}:<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])} /></label>
          </>
        )}

        <button type="submit">{t('inquiryForm.submit')}</button>
        {submitted && <p className="form-success">{t('inquiryForm.successMessage')}</p>}
      </form>
    </div>
  );
};

export default InquiryForm;
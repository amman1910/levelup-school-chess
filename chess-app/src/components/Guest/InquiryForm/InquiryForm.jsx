import logo from '../../../assets/logos/shahtranj_logo_gold.png';

import React, { useEffect, useState } from 'react';
import './InquiryForm.css';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useLocation, useSearchParams } from 'react-router-dom';


const InquiryForm = () => {
const [searchParams] = useSearchParams();

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
      alert('Something went wrong while submitting the form.');
    }
  };

  return (
    <div className="inquiry-form-section" id="join">
      <div className="join-logo-wrapper">
  <img src={logo} alt="Shah2Range Logo" className="join-logo" />
</div>

      <h2 className="inquiry-form-title">Join Us</h2>
      <form onSubmit={handleSubmit} className="inquiry-form">

        <label>
          I am applying as:
          <select name="applicantType" value={form.applicantType} onChange={handleChange} required>
            <option value="">Select...</option>
            <option value="individual">Individual (Student)</option>
            <option value="tournament">Tournament Participant</option>
            <option value="course">Course Enrollment</option>
            <option value="parent">Parent</option>
            <option value="school">School</option>
            <option value="institution">Other Institution</option>
            <option value="coach">Coach Application</option>
          </select>
        </label>

        {/* Dynamic Fields */}
        {form.applicantType === 'individual' && (
          <>
            <label>Full Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Age:<input type="number" name="age" value={form.age} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>Chess Level:
              <select name="chessLevel" value={form.chessLevel} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

       {form.applicantType === 'tournament' && (
  <>
    <label>Full Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
    <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
    <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
    
    <label>Select Tournament:
      <select name="tournamentName" value={form.tournamentName} onChange={handleChange} required>
        <option value="">Select a tournament...</option>
        {tournaments.map((title, index) => (
          <option key={index} value={title}>{title}</option>
        ))}
      </select>
    </label>

    <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
  </>
)}


        {form.applicantType === 'course' && (
          <>
            <label>Full Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>Select Course:
              <select name="courseName" value={form.courseName} onChange={handleChange} required>
                <option value="">Select a course...</option>
                {courses.map((course, index) => (
                  <option key={index} value={course}>{course}</option>
                ))}
              </select>
            </label>
            <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'parent' && (
          <>
            <label>Parent Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'school' && (
          <>
            <label>School Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'institution' && (
          <>
            <label>Institution Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>Notes (optional):<textarea name="notes" value={form.notes} onChange={handleChange} /></label>
          </>
        )}

        {form.applicantType === 'coach' && (
          <>
            <label>Full Name:<input type="text" name="studentName" value={form.studentName} onChange={handleChange} required /></label>
            <label>Phone Number:<input type="text" name="parentContact" value={form.parentContact} onChange={handleChange} required /></label>
            <label>Email:<input type="email" name="parentEmail" value={form.parentEmail} onChange={handleChange} required /></label>
            <label>City:<input type="text" name="city" value={form.city} onChange={handleChange} required /></label>
            <label>University / College:<input type="text" name="college" value={form.college} onChange={handleChange} required /></label>
            <label>Major:<input type="text" name="major" value={form.major} onChange={handleChange} required /></label>
            <label>University Year:<input type="text" name="uniYear" value={form.uniYear} onChange={handleChange} required /></label>
            <label>Last or Current Job:<input type="text" name="lastJob" value={form.lastJob} onChange={handleChange} /></label>
            <label>Age:<input type="number" name="age" value={form.age} onChange={handleChange} required /></label>
            <label>How do you rate your chess knowledge?
              <select name="chessLevelStars" value={form.chessLevelStars} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="1">★☆☆☆☆</option>
                <option value="2">★★☆☆☆</option>
                <option value="3">★★★☆☆</option>
                <option value="4">★★★★☆</option>
                <option value="5">★★★★★</option>
              </select>
            </label>
            <label>Available Days:<textarea name="availableDays" value={form.availableDays} onChange={handleChange} required /></label>
            <label>Available From:<input type="time" name="availableFrom" value={form.availableFrom} onChange={handleChange} required /></label>
            <label>Available To:<input type="time" name="availableTo" value={form.availableTo} onChange={handleChange} required /></label>
            <label>Mentoring Experience:<textarea name="mentoringExp" value={form.mentoringExp} onChange={handleChange} /></label>
            <label>Do you have a car?
              <select name="hasCar" value={form.hasCar} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </label>
            <label>Upload CV (optional):<input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setCvFile(e.target.files[0])} /></label>
          </>
        )}

        <button type="submit">Submit</button>
        {submitted && <p className="form-success">Your request has been submitted successfully. We'll get back to you soon!</p>}
      </form>
    </div>
  );
};

export default InquiryForm;







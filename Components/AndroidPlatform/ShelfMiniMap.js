import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const { width, height } = Dimensions.get("window");

const shelves = [
  { id: "Outdated", top: "5%", left: "19%", width: "32%", height: "8%" },
  { id: "1", top: "16%", left: "70%", width: "15%" },
  { id: "2", top: "16%", left: "53%", width: "15%" },
  { id: "3", top: "16%", left: "36%", width: "15%" },
  { id: "4", top: "16%", left: "19%", width: "15%" },
  { id: "5", top: "34%", left: "87%", width: "15%" },
  { id: "6", top: "16%", left: "87%", width: "15%" },
  { id: "7", top: "5%", left: "53%", width: "32%", height: "8%" },
  { id: "8", top: "16%", left: "2%", width: "15%" },
  { id: "9", top: "34%", left: "2%", width: "15%" },
  { id: "10", top: "52%", left: "2%", width: "15%" },
  { id: "11", top: "70%", left: "2%", width: "15%" },
  { id: "12", top: "77%", left: "20%", width: "35%", height: "8%" },
  { id: "13", top: "52%", left: "87%", width: "15%" },
];

const ShelfMiniMap = () => {
  const [books, setBooks] = useState([]);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedShelf, setHighlightedShelf] = useState(null);
  const [highlightedLayer, setHighlightedLayer] = useState(null);
  const [highlightedBookId, setHighlightedBookId] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [readingBooks, setReadingBooks] = useState({});
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [studentNumberInput, setStudentNumberInput] = useState("");
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [shelfNumbers, setShelfNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [studentExists, setStudentExists] = useState(false);

  const flatListRef = useRef(null);
  const scrollViewRef = useRef(null);

  const [formModalVisible, setFormModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    section: "",
    yearLevel: "",
    department: "",
    studentNumber: "",
    bookTitle: "",
  });

  const handleSubmit = async () => {
    if (
      !userInfo.fullName ||
      !userInfo.section ||
      !userInfo.yearLevel ||
      !userInfo.department ||
      !userInfo.studentNumber
    ) {
      alert("⚠️ Please fill in all fields before proceeding!");
      return;
    }

    setLoading(true);
    try {
      const bookRef = doc(db, "books", selectedBook.id);
      const bookSnapshot = await getDoc(bookRef);
      const bookData = bookSnapshot.data();

      if (!bookData) {
        alert("⚠️ Book not found!");
        setLoading(false);
        return;
      }

      let currentCopies =
        books.find((b) => b.id === selectedBook.id)?.copiesAvailable || 0;

      if (currentCopies >= 1) {
        setBooks((prevBooks) =>
          prevBooks.map((book) =>
            book.id === selectedBook.id
              ? { ...book, copiesAvailable: Math.max(currentCopies - 1, 0) }
              : book
          )
        );

        setSelectedBook((prev) => ({
          ...prev,
          copiesAvailable: Math.max(currentCopies - 1, 0),
        }));

        const sessionRef = await addDoc(collection(db, "reading_sessions"), {
          ...userInfo,
          timestamp: new Date(),
          status: "Reading",
        });

        setReadingBooks((prev) => ({
          ...prev,
          [selectedBook.id]: (prev[selectedBook.id] || 0) + 1,
        }));

        alert("📖 Reading session started successfully!");

        setUserInfo({
          fullName: "",
          section: "",
          yearLevel: "",
          department: "",
          studentNumber: "",
          bookTitle: "",
        });

        setFormModalVisible(false);
        setBookModalVisible(false);
        setModalVisible(false);
        setFinishModalVisible(false);
      } else {
        alert("⚠️ No copies available!");
      }
    } catch (error) {
      alert("⚠️ Error starting session: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishReading = async () => {
    if (!selectedSession) {
      alert("⚠️ Please select a book to finish!");
      return;
    }

    try {
      let updatedBooks = books.map((book) => {
        if (book.title === selectedSession.bookTitle) {
          let currentCopies = parseInt(book.copiesAvailable, 10) || 0;
          let totalCopies = parseInt(book.totalCopies, 10) || 0;

          let newCopiesAvailable = Math.min(currentCopies + 1, totalCopies);

          return {
            ...book,
            copiesAvailable: newCopiesAvailable,
          };
        }
        return book;
      });

      setBooks(updatedBooks);

      const sessionRef = doc(db, "reading_sessions", selectedSession.id);
      await updateDoc(sessionRef, {
        status: "Done Reading",
        finishedTimestamp: new Date(),
      });

      setActiveSessions((prevSessions) =>
        prevSessions.filter((s) => s.id !== selectedSession.id)
      );

      setSelectedSession(null);

      alert(`✅ Marked "${selectedSession.bookTitle}" as Done Reading!`);
    } catch (error) {
      alert("⚠️ Failed to update session: " + error.message);
    }
  };

  const fetchActiveSessions = async () => {
    if (!studentNumberInput.trim()) {
      alert("⚠️ Please enter a Student Number!");
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "reading_sessions"));

      querySnapshot.forEach((doc) => console.log(doc.data()));

      let foundSessions = [];

      querySnapshot.forEach((doc) => {
        const sessionData = doc.data();
        if (
          sessionData.studentNumber.trim().toUpperCase() ===
            studentNumberInput.trim().toUpperCase() &&
          sessionData.status === "Reading"
        ) {
          foundSessions.push({ id: doc.id, ...sessionData });
        }
      });

      if (foundSessions.length > 0) {
        setActiveSessions(foundSessions);
        setSelectedSession(null);
      } else {
        alert("⚠️ No active reading sessions found!");
        setActiveSessions([]);
        setSelectedSession(null);
      }
    } catch (error) {
      alert("⚠️ Error fetching sessions: " + error.message);
    }
  };
  useEffect(() => {
    const booksCollection = collection(db, "books");

    const unsubscribe = onSnapshot(booksCollection, (querySnapshot) => {
      const booksData = querySnapshot.docs.map((doc) => doc.data());

      const uniqueShelves = [
        ...new Set(booksData.map((book) => book.shelfLocation)),
      ];

      const sortedShelves = uniqueShelves.sort(
        (a, b) => parseInt(a) - parseInt(b)
      );

      setShelfNumbers(sortedShelves);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setHighlightedShelf(null);
      setHighlightedLayer(null);
      setHighlightedBookId(null);
      return;
    }

    const foundBook = books.find((book) => {
      const search = searchTerm.toLowerCase();

      const titleMatch = book.title?.toLowerCase().includes(search);
      const authorMatch = book.author?.toLowerCase().includes(search);

      const categoryMatch = Array.isArray(book.category)
        ? book.category.some(
            (cat) =>
              typeof cat === "string" && cat.toLowerCase().includes(search)
          )
        : typeof book.category === "string" &&
          book.category.toLowerCase().includes(search);

      return titleMatch || authorMatch || categoryMatch;
    });

    if (foundBook) {
      setHighlightedShelf(foundBook.shelfLocation);
      setHighlightedLayer(foundBook.layerNumber);
      setHighlightedBookId(foundBook.id);
    } else {
      setHighlightedShelf(null);
      setHighlightedLayer(null);
      setHighlightedBookId(null);
    }
  }, [searchTerm, books]);

  const booksInShelf = (shelfId) => {
    const groupedBooks = {};
    books
      .filter((book) => book.shelfLocation === shelfId)
      .sort((a, b) => a.layerNumber - b.layerNumber)
      .forEach((book) => {
        if (!groupedBooks[book.layerNumber]) {
          groupedBooks[book.layerNumber] = [];
        }
        groupedBooks[book.layerNumber].push(book);
      });

    return groupedBooks;
  };

  const booksInSelectedShelf = useMemo(
    () => booksInShelf(selectedShelf),
    [books, searchTerm, selectedShelf]
  );

  useEffect(() => {
    const booksCollection = collection(db, "books");

    const unsubscribe = onSnapshot(booksCollection, (querySnapshot) => {
      const booksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        copiesAvailable: parseInt(doc.data().copiesAvailable, 10) || 0,
        totalCopies: Number(doc.data().totalCopies) || 0,
        color: getRandomColor(),
      }));
      setBooks(booksData);
    });

    return () => unsubscribe();
  }, []);

  const getRandomColor = () => {
    const colors = [
      "#8B0000",
      "#180828",
      "#006400",
      "#4682B4",
      "#8A2BE2",
      "#001731",
      "#052814",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  useEffect(() => {
    if (
      highlightedBookId &&
      flatListRef.current &&
      books.length > 0 &&
      modalVisible
    ) {
      const shelfBooks = books
        .filter((book) => book.shelfLocation === selectedShelf)
        .sort((a, b) => parseInt(a.layerNumber) - parseInt(b.layerNumber));

      const index = shelfBooks.findIndex(
        (book) => book.id === highlightedBookId
      );

      if (index !== -1 && index < shelfBooks.length) {
        setTimeout(() => {
          try {
            flatListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0.5,
            });
          } catch (error) {
            flatListRef.current.scrollToOffset({
              offset: index * 120,
              animated: true,
            });
          }
        }, 500);
      } else {
        ``;
      }
    }
  }, [highlightedBookId, books, modalVisible, selectedShelf]);

  useEffect(() => {
    if (highlightedLayer && scrollViewRef.current) {
      const layerIndex = Object.keys(booksInSelectedShelf).indexOf(
        highlightedLayer.toString()
      );

      if (layerIndex !== -1) {
        setTimeout(() => {
          scrollViewRef.current.scrollTo({
            y: layerIndex * 150,
            animated: true,
          });
        }, 500);
      }
    }
  }, [highlightedLayer, booksInSelectedShelf, modalVisible]);

  const autoFillUserData = async () => {
    const formattedStudentNumber = userInfo.studentNumber.trim().toUpperCase();

    if (!formattedStudentNumber) return;

    try {
      const q = query(
        collection(db, "reading_sessions"),
        where("studentNumber", "==", formattedStudentNumber)
      );
      const querySnapshot = await getDocs(q);

      const matchingSessions = querySnapshot.docs;
      if (matchingSessions.length > 0) {
        const data = matchingSessions[0].data();
        setUserInfo((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          section: data.section || prev.section,
          yearLevel: data.yearLevel || prev.yearLevel,
          department: data.department || prev.department,
        }));
        setAutoFillSuccess(true);
      } else {
        setAutoFillSuccess(false);
      }
    } catch (error) {}
  };

  const checkStudentExists = async () => {
    const formattedStudentNumber = userInfo.studentNumber.trim().toUpperCase();
    if (!formattedStudentNumber) {
      setStudentExists(false);
      return;
    }
    try {
      const q = query(
        collection(db, "reading_sessions"),
        where("studentNumber", "==", formattedStudentNumber)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.docs.length > 0) {
        setStudentExists(true);
      } else {
        setStudentExists(false);
      }
    } catch (error) {
      setStudentExists(false);
    }
  };

  useEffect(() => {
    if (userInfo.studentNumber.trim() !== "") {
      const delayDebounceFn = setTimeout(() => {
        checkStudentExists();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else {
      setStudentExists(false);
    }
  }, [userInfo.studentNumber]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior="height" style={styles.container}>
        <View style={styles.inner}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search books..."
              placeholderTextColor="#888"
              value={searchTerm}
              onChangeText={(text) => setSearchTerm(text)}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchTerm("")}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✖</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.finishReadingContainer}>
            <View style={styles.pickerButtonWrapper}>
              <Picker
                selectedValue={selectedShelf}
                style={styles.picker}
                onValueChange={(itemValue) => {
                  if (itemValue) {
                    setSelectedShelf(itemValue);
                    setModalVisible(true);
                  }
                }}
                mode="dropdown"
              >
                <Picker.Item
                  label="Select Shelf"
                  value=""
                  style={styles.pickerItem}
                />
                {shelfNumbers.map((shelf) => (
                  <Picker.Item
                    key={shelf}
                    label={`Shelf ${shelf}`}
                    value={shelf}
                    style={styles.pickerItem}
                  />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => setFinishModalVisible(true)}
            >
              <Text style={styles.finishButtonText}>✅ Finish Reading</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.miniMapContainer}>
            {shelves.map((shelf) => (
              <TouchableOpacity
                key={shelf.id}
                style={[
                  styles.shelf,
                  shelf,
                  highlightedShelf === shelf.id && styles.highlightedShelf,
                ]}
                onPress={() => {
                  setSelectedShelf(shelf.id);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.shelfText}>Shelf {shelf.id}</Text>

                {highlightedShelf === shelf.id && (
                  <Text style={styles.arrow}>👇</Text>
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.entrance}>
              <Text style={styles.entranceText}>🚪Entrance</Text>
            </View>

            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent={true}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>
                    Books in Shelf {selectedShelf}
                  </Text>

                  <ScrollView ref={scrollViewRef} style={styles.scrollView}>
                    {Object.entries(booksInSelectedShelf).map(
                      ([layer, books]) => (
                        <View key={layer} style={styles.layerContainer}>
                          <Text style={styles.layerTitle}>Layer {layer}</Text>
                          <FlatList
                            ref={flatListRef}
                            data={books}
                            horizontal
                            keyExtractor={(item) => item.id}
                            initialScrollIndex={
                              highlightedBookId
                                ? books.findIndex(
                                    (book) => book.id === highlightedBookId
                                  )
                                : 0
                            }
                            getItemLayout={(data, index) => ({
                              length: 120,
                              offset: 120 * index,
                              index,
                            })}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedBook(item);
                                  setBookModalVisible(true);
                                }}
                              >
                                <View
                                  style={[
                                    styles.bookContainer,
                                    item.id === highlightedBookId &&
                                      styles.highlightedBookContainer,
                                  ]}
                                >
                                  {item.id === highlightedBookId && (
                                    <Text style={styles.bookArrow}>👇</Text>
                                  )}
                                  <View
                                    style={[
                                      styles.bookSpine,
                                      { backgroundColor: item.color },
                                      item.id === highlightedBookId &&
                                        styles.highlightedBookSpine,
                                    ]}
                                  >
                                    <Text style={styles.bookTitle}>
                                      {item.title}
                                    </Text>
                                    <View style={styles.copiesContainer}>
                                      <Text style={styles.copiesText}>
                                        {item?.copiesAvailable !== undefined
                                          ? Math.max(
                                              Number(item.copiesAvailable),
                                              0
                                            )
                                          : "N/A"}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </TouchableOpacity>
                            )}
                            showsHorizontalScrollIndicator={false}
                          />
                        </View>
                      )
                    )}
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal
              visible={bookModalVisible}
              animationType="fade"
              transparent={true}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.bookInfoModal}>
                  <Text style={styles.modalTitle}>📖 Book Details</Text>
                  {selectedBook && (
                    <ScrollView style={styles.bookDetailsContainer}>
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Title: </Text>
                        <Text style={styles.value}>{selectedBook.title}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Author: </Text>
                        <Text style={styles.value}>{selectedBook.author}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Description: </Text>
                        <Text style={styles.value}>
                          {selectedBook.bookDescription}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Category: </Text>
                        <Text style={styles.value}>
                          {selectedBook.category}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Publisher: </Text>
                        <Text style={styles.value}>
                          {selectedBook.publisher}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Year: </Text>
                        <Text style={styles.value}>{selectedBook.year}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>ISBN: </Text>
                        <Text style={styles.value}>{selectedBook.isbn}</Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Total Copies: </Text>
                        <Text style={styles.value}>
                          {selectedBook.totalCopies}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Available Copies: </Text>
                        <Text style={styles.value}>
                          {selectedBook?.copiesAvailable !== undefined
                            ? Math.max(Number(selectedBook.copiesAvailable), 0)
                            : "N/A"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Shelf: </Text>
                        <Text style={styles.value}>
                          {selectedBook.shelfLocation}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Layer: </Text>
                        <Text style={styles.value}>
                          {selectedBook.layerNumber}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Department: </Text>
                        <Text style={styles.value}>
                          {selectedBook.department.join(", ")}
                        </Text>
                      </View>

                      <View style={{ marginTop: 20, alignItems: "center" }}>
                        {selectedBook?.copiesAvailable >= 1 ? (
                          <TouchableOpacity
                            style={styles.readButton}
                            onPress={() => {
                              setUserInfo((prev) => ({
                                ...prev,
                                bookTitle: selectedBook?.title || "",
                              }));

                              setFormModalVisible(true);
                            }}
                          >
                            <Text style={styles.readButtonText}>
                              📖 Start Reading
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.noCopiesText}>
                            ❌ No more copies available
                          </Text>
                        )}
                      </View>
                    </ScrollView>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setBookModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal
              visible={formModalVisible}
              animationType="slide"
              transparent={true}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.formModal}>
                  <Text style={styles.modalTitle}>
                    📋 Enter Your Information
                  </Text>

                  <ScrollView>
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Student Number:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Ex: AY2021-00212"
                        value={userInfo.studentNumber}
                        onChangeText={(text) => {
                          setUserInfo({ ...userInfo, studentNumber: text });

                          setAutoFillSuccess(false);
                          setStudentExists(false);
                        }}
                        onEndEditing={checkStudentExists}
                      />

                      {studentExists && (
                        <TouchableOpacity
                          style={[
                            styles.loadDataButton,
                            autoFillSuccess && styles.loadDataButtonSuccess,
                          ]}
                          onPress={autoFillUserData}
                          disabled={autoFillSuccess}
                        >
                          <Text
                            style={[
                              styles.loadDataButtonText,
                              autoFillSuccess &&
                                styles.loadDataButtonTextSuccess,
                            ]}
                          >
                            {autoFillSuccess ? "Got it!" : "Show My Info"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Full Name:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Full Name"
                        value={userInfo.fullName}
                        onChangeText={(text) =>
                          setUserInfo({ ...userInfo, fullName: text })
                        }
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Section:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Section"
                        value={userInfo.section}
                        onChangeText={(text) =>
                          setUserInfo({ ...userInfo, section: text })
                        }
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Year Level:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Year Level"
                        value={userInfo.yearLevel}
                        onChangeText={(text) =>
                          setUserInfo({ ...userInfo, yearLevel: text })
                        }
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Department:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter Department"
                        value={userInfo.department}
                        onChangeText={(text) =>
                          setUserInfo({ ...userInfo, department: text })
                        }
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Selected Book:</Text>
                      <TextInput
                        style={styles.input}
                        value={userInfo.bookTitle}
                        editable={false}
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        loading && { backgroundColor: "#ccc" },
                      ]}
                      onPress={handleSubmit}
                      disabled={loading}
                    >
                      <Text style={styles.submitButtonText}>
                        {loading
                          ? "⏳ Processing..."
                          : "Confirm & Start Reading"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => {
                        setUserInfo({
                          fullName: "",
                          section: "",
                          yearLevel: "",
                          department: "",
                          studentNumber: "",
                          bookTitle: "",
                        });
                        setAutoFillSuccess(false);
                        setFormModalVisible(false);
                      }}
                    >
                      <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </Modal>
            <Modal
              visible={finishModalVisible}
              animationType="slide"
              transparent={true}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.formModal}>
                  <Text style={styles.modalTitle}>📋 Finish Reading</Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Student Number:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: AY2021-00213"
                      value={studentNumberInput}
                      onChangeText={(text) => setStudentNumberInput(text)}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={fetchActiveSessions}
                  >
                    <Text style={styles.submitButtonText}>
                      🔍 Find Sessions
                    </Text>
                  </TouchableOpacity>

                  {activeSessions.length > 0 ? (
                    <ScrollView style={styles.sessionListContainer}>
                      <Text style={styles.sessionListTitle}>
                        Active Reading Sessions:
                      </Text>
                      {activeSessions.map((session) => (
                        <TouchableOpacity
                          key={session.id}
                          style={[
                            styles.sessionItem,
                            selectedSession?.id === session.id &&
                              styles.selectedSessionItem,
                          ]}
                          onPress={() => setSelectedSession(session)}
                        >
                          <View style={styles.sessionDetails}>
                            <Text style={styles.sessionBookTitle}>
                              {session.bookTitle}
                            </Text>
                            <Text style={styles.sessionMeta}>
                              📅{" "}
                              {new Date(
                                session.timestamp.seconds * 1000
                              ).toLocaleString()}
                            </Text>
                            <Text style={styles.sessionMeta}>
                              📍 {session.department}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  ) : (
                    <Text style={styles.noSessionsText}>
                      No active reading sessions found.
                    </Text>
                  )}

                  {selectedSession && (
                    <TouchableOpacity
                      style={styles.finishButtonConfirm}
                      onPress={handleFinishReading}
                    >
                      <Text style={styles.finishButtonTextConfirm}>
                        ✅ Confirm Finish
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      setStudentNumberInput("");
                      setActiveSessions([]);
                      setFinishModalVisible(false);
                    }}
                  >
                    <Text style={styles.closeButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  miniMapContainer: {
    width: width * 0.99,
    height: height * 0.9,
    backgroundColor: "transparent",
    borderRadius: 10,
    padding: 10,
    position: "relative",
    alignSelf: "center",
  },
  searchContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    position: "relative",
    marginTop: 0,
  },

  searchInput: {
    width: "98%",
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#d2691e",
    borderRadius: 25,
    fontSize: 16,
    backgroundColor: "#FAF3E0",
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    color: "#333",
  },

  shelf: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "10%",
    height: "15%",
    borderRadius: 5,
    borderWidth: 3,
    borderColor: "gold",
    backgroundColor: "#FEF9E1",
    overflow: "hidden",
  },
  shelfText: {
    color: "#6D2323",
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
  entrance: {
    position: "absolute",
    bottom: "16%",
    left: "73%",
    backgroundColor: "gold",
    padding: 5,
    borderRadius: 5,
  },
  entranceText: {
    color: "#6D2323",
    fontSize: width * 0.04,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    height: "70%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  scrollView: {
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  bookContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },

  bookAuthor: {
    fontSize: 14,
    fontStyle: "italic",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  layerContainer: {
    marginBottom: 15,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#8B4513",
    shadowColor: "#8b4513",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 10,
  },
  layerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#fff",
  },

  bookSpine: {
    width: 100,
    height: 130,
    backgroundColor: "#8B0000",
    borderWidth: 2,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotateY: "5deg" }],
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#d2691e",
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    padding: 10,
    borderTopColor: "none",
    borderLeftWidth: 5,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderTopWidth: 0,
  },
  bookTitle: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
    flexWrap: "wrap",
  },
  highlightedShelf: {
    borderColor: "#052814",
  },

  arrow: {
    position: "absolute",
    top: "-0%",
    fontSize: 20,
    color: "yellow",
  },
  highlightedLayer: {
    backgroundColor: "rgba(255, 215, 0, 0.8)",
    borderWidth: 2,
    borderColor: "yellow",
  },

  highlightedBookContainer: {
    backgroundColor: "rgba(255, 255, 0, 0.5)",
    borderRadius: 5,
  },

  highlightedBookSpine: {
    borderColor: "yellow",
    borderWidth: 3,
  },
  bookArrow: {
    position: "absolute",
    top: -0,
    left: "80%",
    transform: [{ translateX: -10 }],
    fontSize: 30,
    color: "yellow",
    zIndex: 10,
  },
  copiesContainer: {
    position: "absolute",
    bottom: 5,
    left: 5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },

  copiesText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  bookInfoModal: {
    width: "85%",
    height: "75%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#d2691e",
    paddingBottom: 5,
    color: "#8B4513",
  },

  bookDetailsContainer: {
    maxHeight: "75%",
    paddingVertical: 10,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: "#FAF3E0",
    borderRadius: 10,
    shadowColor: "#8B4513",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },

  label: {
    fontWeight: "bold",
    color: "#8B4513",
    fontSize: 16,
    width: 125,
    textAlign: "left",
  },

  value: {
    color: "#333",
    fontSize: 16,
    flex: 1,
    flexWrap: "wrap",
    marginLeft: 5,
  },

  closeButton: {
    marginTop: 15,
    backgroundColor: "#d9534f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  clearButton: {
    position: "absolute",
    right: 15,
    top: "45%",
    transform: [{ translateY: -10 }],
    borderRadius: 15,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 15,
    color: "#333",
  },
  readButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
  },

  readButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  finishButtonConfirm: {
    backgroundColor: "#FF5733",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    marginTop: 10,
  },

  finishButtonTextConfirm: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  noCopiesText: {
    color: "#FF0000",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  formModal: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },

  inputContainer: {
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#d2691e",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FAF3E0",
  },

  submitButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  closeButton: {
    backgroundColor: "#d9534f",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },

  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  sessionListContainer: {
    maxHeight: 250,
    marginTop: 10,
    paddingHorizontal: 5,
  },

  sessionListTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#8B4513",
  },

  sessionItem: {
    backgroundColor: "#FAF3E0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },

  selectedSessionItem: {
    backgroundColor: "#FFD700",
    borderColor: "#8B4513",
    borderWidth: 2,
  },

  sessionDetails: {
    flex: 1,
  },

  sessionBookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
  },

  sessionMeta: {
    fontSize: 12,
    color: "#555",
    marginTop: 3,
  },

  noSessionsText: {
    color: "gray",
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
  },
  pickerButtonWrapper: {
    width: "90%",
    maxWidth: 350,
    height: 50,
    borderWidth: 1,
    borderColor: "#d2691e",
    borderRadius: 10,
    backgroundColor: "#FAF3E0",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    justifyContent: "center",
  },

  picker: {
    height: 50,
    width: "100%",
    maxWidth: 350,
    color: "#333",
  },

  pickerItem: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6D2323",
  },

  finishButton: {
    width: "90%",
    maxWidth: 350,
    height: 50,
    backgroundColor: "#FF5733",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },

  finishButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  finishReadingContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 10,
  },
  loadDataButton: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  loadDataButtonSuccess: {
    backgroundColor: "transparent",
  },
  loadDataButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadDataButtonTextSuccess: {
    color: "green",
  },
});

export default ShelfMiniMap;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "./firebase.js";
import { collection, getDocs } from "firebase/firestore";
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
} from "react-native";

const { width, height } = Dimensions.get("window");

const shelves = [
  { id: "Outdated", top: "9%", left: "19%", width: "32%", height: "8%" },
  { id: "1", top: "20%", left: "70%", width: "15%" },
  { id: "2", top: "20%", left: "53%", width: "15%" },
  { id: "3", top: "20%", left: "36%", width: "15%" },
  { id: "4", top: "20%", left: "19%", width: "15%" },
  { id: "5", top: "38%", left: "87%", width: "15%" },
  { id: "6", top: "20%", left: "87%", width: "15%" },
  { id: "7", top: "9%", left: "53%", width: "32%", height: "8%" },
  { id: "8", top: "20%", left: "2%", width: "15%" },
  { id: "9", top: "38%", left: "2%", width: "15%" },
  { id: "10", top: "56%", left: "2%", width: "15%" },
  { id: "11", top: "74%", left: "2%", width: "15%" },
  { id: "12", top: "81%", left: "20%", width: "35%", height: "8%" },
  { id: "13", top: "56%", left: "87%", width: "15%" },
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

  const flatListRef = useRef(null);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setHighlightedShelf(null);
      setHighlightedLayer(null);
      setHighlightedBookId(null);
      return;
    }

    const foundBook = books.find((book) =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, "books");
        const querySnapshot = await getDocs(booksCollection);

        const booksData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          color: getRandomColor(),
        }));

        setBooks(booksData);
      } catch (error) {}
    };
    fetchBooks();
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
                                        {Math.max(
                                          item.copiesAvailable -
                                            (readingBooks[item.id] || 0),
                                          0
                                        )}
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
                          {selectedBook
                            ? Math.max(
                                selectedBook.copiesAvailable -
                                  (readingBooks[selectedBook.id] || 0),
                                0
                              )
                            : ""}
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

                      {/* 🟢 Add Reading Buttons Below the Book Details */}
                      <View style={{ marginTop: 20, alignItems: "center" }}>
                        {readingBooks[selectedBook.id] === undefined ||
                        readingBooks[selectedBook.id] <
                          selectedBook.copiesAvailable ? (
                          <TouchableOpacity
                            style={styles.readButton}
                            onPress={() => {
                              setReadingBooks((prev) => ({
                                ...prev,
                                [selectedBook.id]:
                                  (prev[selectedBook.id] || 0) + 1,
                              }));
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

                        {readingBooks[selectedBook.id] > 0 && (
                          <TouchableOpacity
                            style={styles.finishButton}
                            onPress={() => {
                              setReadingBooks((prev) => {
                                const updatedBooks = { ...prev };
                                updatedBooks[selectedBook.id] = Math.max(
                                  updatedBooks[selectedBook.id] - 1,
                                  0
                                );
                                if (updatedBooks[selectedBook.id] === 0) {
                                  delete updatedBooks[selectedBook.id];
                                }
                                return updatedBooks;
                              });
                            }}
                          >
                            <Text style={styles.finishButtonText}>
                              ✅ Finish Reading
                            </Text>
                          </TouchableOpacity>
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
    marginTop: 30,
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
    bottom: "10%",
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
    width: 100,
    textAlign: "left",
  },

  value: {
    color: "#333",
    fontSize: 16,
    flex: 1,
    flexWrap: "wrap",
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
    marginTop: 10,
  },

  readButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  finishButton: {
    backgroundColor: "#FF5733",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    width: "80%",
    marginBottom: 10,
    marginTop: 10,
  },

  finishButtonText: {
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
});

export default ShelfMiniMap;

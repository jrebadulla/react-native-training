import React, { useEffect, useMemo, useState } from "react";
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
  { id: "Outdated", top: "5%", left: "20%", width: "28%", height: "10%" },
  { id: "1", top: "20%", left: "73%" },
  { id: "2", top: "20%", left: "55%" },
  { id: "3", top: "20%", left: "37%" },
  { id: "4", top: "20%", left: "20%" },
  { id: "5", top: "38%", left: "91%" },
  { id: "6", top: "20%", left: "91%" },
  { id: "7", top: "5%", left: "55%", width: "28%", height: "10%" },
  { id: "8", top: "20%", left: "2%" },
  { id: "9", top: "38%", left: "2%" },
  { id: "10", top: "56%", left: "2%" },
  { id: "11", top: "74%", left: "2%" },
  { id: "12", top: "80%", left: "15%", width: "30%", height: "8%" },
  { id: "13", top: "56%", left: "91%" },
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
      .filter(
        (book) =>
          book.shelfLocation === shelfId &&
          book.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
      } catch (error) {
        console.error("Error fetching books:", error);
      }
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

                  <ScrollView style={styles.scrollView}>
                    {Object.entries(booksInSelectedShelf).map(
                      ([layer, books]) => (
                        <View key={layer} style={styles.layerContainer}>
                          <Text style={styles.layerTitle}>Layer {layer}</Text>
                          <FlatList
                            data={books}
                            horizontal
                            keyExtractor={(item) => item.id}
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
                                        {item.copiesAvailable}
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
            {/* Book Info Modal */}
            {/* Book Info Modal */}
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
                        <Text style={styles.label}> Publisher:</Text>
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
                          {selectedBook.copiesAvailable}
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
    marginVertical: 20,
  },
  searchContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: 15,
  },

  searchInput: {
    width: "95%",
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
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#8b4513",
    backgroundColor: "rgba(139, 69, 19, 0.9)",
    overflow: "hidden",
  },
  shelfText: {
    color: "white",
    fontSize: width * 0.02,
    fontWeight: "bold",
  },
  entrance: {
    position: "absolute",
    bottom: "10%",
    left: "73%",
    backgroundColor: "red",
    padding: 5,
    borderRadius: 5,
  },
  entranceText: {
    color: "white",
    fontSize: width * 0.02,
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
    borderColor: "yellow",
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
    borderRadius: 3,
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
});

export default ShelfMiniMap;

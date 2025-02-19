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
          <TextInput
            style={styles.searchInput}
            placeholder="Search books..."
            placeholderTextColor="#888"
            value={searchTerm}
            onChangeText={(text) => setSearchTerm(text)}
          />
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
  searchInput: {
    width: "100%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
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
    color: "#333",
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
});

export default ShelfMiniMap;

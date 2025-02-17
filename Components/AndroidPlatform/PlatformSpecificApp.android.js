import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { db, collection, getDocs } from "./firebase";
import Icon from "react-native-vector-icons/MaterialIcons";
import { debounce } from "lodash";
import { Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWindowDimensions } from "react-native";

export default function PlatformSpecificApp() {
  const [books, setBooks] = useState(() => []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState(() => []);
  const [loading, setLoading] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height; 

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    if (loading) {
      loopAnimation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      loopAnimation.current.start();
    } else {
      loopAnimation.current?.stop();
      spinValue.setValue(0); // Reset animation to avoid getting stuck mid-spin
    }
  }, [loading]);
  

  const fetchBooks = async () => {
    setLoading(true);
    startLoadingAnimation();
    try {
      const querySnapshot = await getDocs(collection(db, "books"));
      const booksList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(booksList);
      setFilteredBooks(booksList);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
    setLoading(false);
    stopLoadingAnimation();
  };

  useEffect(() => {
    fetchBooks();
  }, []);

const debouncedSearch = useCallback(
  debounce((query) => {
    setSearchLoading(true);
    const lowerCaseQuery = query.toLowerCase().trim();
    setFilteredBooks(
      books.filter(
        (book) =>
          book.title?.toLowerCase().includes(lowerCaseQuery) ||
          book.author?.toLowerCase().includes(lowerCaseQuery)
      )
    );
    setSearchLoading(false);
  }, 200),
  [books]
);


  const handleSearchChange = (text) => {
    setSearchQuery(text);

    if (text.trim() === "") {
      setFilteredBooks(books);
      return;
    }

    const lowerCaseQuery = text.toLowerCase().trim();

    const filtered = books.filter(
      (book) =>
        book.title?.toLowerCase().includes(lowerCaseQuery) ||
        book.author?.toLowerCase().includes(lowerCaseQuery)
    );

    setFilteredBooks(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredBooks(books);
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchBooks().then(() => setLoading(false));
  };
  

  const groupedBooks = useMemo(() => {
    const sourceBooks = searchQuery ? filteredBooks : books;

    return sourceBooks.reduce((groups, book) => {
      const shelf = book.shelfLocation || "Unknown";
      const layer = book.layerNumber || "Unknown Layer Number";

      if (!groups[shelf]) {
        groups[shelf] = {};
      }
      if (!groups[shelf][layer]) {
        groups[shelf][layer] = [];
      }
      groups[shelf][layer].push(book);

      return groups;
    }, {});
  }, [filteredBooks, books, searchQuery]);

  const startLoadingAnimation = () => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopLoadingAnimation = () => {
    spinValue.stopAnimation();
  };

  return (
    <LinearGradient colors={["#6D2323", "#FEF9E1"]} style={styles.appContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, styles.textInputWithIcon]}
          placeholder="Search book title or author here..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {loading ? (
          <Animated.View
            style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}
          >
            <Icon
              name="autorenew"
              size={24}
              color="transparent"
              style={styles.searchIcon}
            />
          </Animated.View>
        ) : searchQuery ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
          >
            <Icon name="clear" size={24} color="#6D2323" />
          </TouchableOpacity>
        ) : (
          <Icon
            name="search"
            size={24}
            color="#6D2323"
            style={styles.searchIcon}
          />
        )}

        <Image source={require("../../assets/read.png")} style={styles.logo} />
      </View>
      <View>
        <Text style={styles.searchTitle}>Books:</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          {loading ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Icon name="autorenew" size={28} color="#FEF9E1" />
            </Animated.View>
          ) : (
            <Icon name="refresh" size={28} color="#FEF9E1" />
          )}
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Object.keys(groupedBooks).map((shelfLocation) => (
          <LinearGradient
            key={shelfLocation}
            colors={["#551313", "#f3e5df"]}
            style={styles.shelfContainer}
          >
            <Text style={styles.shelfTitle}>
              SHELF LOCATION NUMBER {shelfLocation}
            </Text>

            {Object.keys(groupedBooks[shelfLocation]).map((layer) => (
              <View key={layer} style={styles.layerContainer}>
                <Text style={styles.layerTitle}>Layer {layer}</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shelfRow}
                >
                  {groupedBooks[shelfLocation][layer].map((book) => (
                    <TouchableOpacity key={book.id} style={styles.bookCard}>
                      <LinearGradient
                        colors={["#681313", "hsl(40, 73%, 80%)"]}
                        style={styles.bookCardBackground}
                      >
                        <View
                          style={[
                            styles.ribbon,
                            {
                              backgroundColor:
                                book.copiesAvailable > 0
                                  ? "#28a745"
                                  : "#dc3545",
                            },
                          ]}
                        >
                          <Text style={styles.ribbonText}>
                            {book.copiesAvailable > 0
                              ? "Available"
                              : "Unavailable"}
                          </Text>
                        </View>
                        <View style={styles.bookCover}>
                          <Text style={styles.bookTitle}>
                            {book.title || "Untitled"}
                          </Text>
                          <Text style={styles.bookAuthor}>
                            {book.author
                              ? `by ${book.author.trim()}`
                              : "Unknown Author"}
                          </Text>
                        </View>
                        <View style={styles.copiesAvailableBadge}>
                          <Text style={styles.copiesAvailableText}>
                            {book.copiesAvailable} Copies
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))}
          </LinearGradient>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#6D2323",
    padding: 10,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 50,
    alignItems: "center",
  },
  textInput: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 16,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FEF9E1",
    marginBottom: 20,
  },
  shelfContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    shadowColor: "rgba(0, 0, 0, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    backgroundColor: "#FEF9E1",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    transformStyle: "preserve-3d",
    elevation: 6,
    borderWidth: 1,
    borderColor: "transparent",
    overflow: "hidden",
    backgroundClip: "padding-box",
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FEF9E1",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "#FEF9E1",
    top: -10,
    textShadowRadius: 10,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  shelfRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookCard: {
    backgroundColor: "#FEF9E1",
    marginVertical: 10,
    marginRight: 15,
    borderRadius: 15,
    shadowColor: "rgba(0, 0, 0, 0.3)",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
    borderWidth: 1,
    borderColor: "transparent",
    position: "relative",
  },
  bookCover: {
    width: 120,
    height: 170,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FEF9E1",
    textAlign: "center",
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 10,
    fontWeight: "300",
    color: "#6D2323",
    textAlign: "center",
  },
  clearButton: {
    position: "absolute",
    right: 30,
    top: 5,
    padding: 7,
  },
  noResults: {
    fontSize: 16,
    color: "#FEF9E1",
    textAlign: "center",
    marginTop: 20,
    right: 30,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: 14,
    transform: [{ rotate: "360deg" }],
  },

  textInputWithIcon: {
    paddingLeft: 40,
  },
  loadingIcon: {
    position: "absolute",
    right: 10,
    top: 14,
  },

  bookCardBackground: {
    borderRadius: 15,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0.5,
    borderColor: "#ddd",
  },
  logo: {
    position: "absolute",
    right: 10,
    top: 12,
    width: 28,
    height: 28,
  },
  noData: {
    position: "absolute",
    left: 330,
    top: 0,
    width: 48,
    height: 48,
  },

  ribbon: {
    position: "absolute",
    top: 24,
    left: 80,
    width: 70,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-90deg" }],
    zIndex: 1,
    borderTopLeftRadius: 20,
    borderBottomRightRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  ribbonText: {
    fontSize: 8,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    textTransform: "uppercase",
  },
  refreshButton: {
    position: "absolute",
    left: 70,
    top: -1,
  },
  layerContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#6D2323",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  layerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  copiesAvailableBadge: {
    position: "absolute",
    left: 5,
    bottom: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  copiesAvailableText: {
    fontSize: 10,
    color: "#6D2323",
  },
});

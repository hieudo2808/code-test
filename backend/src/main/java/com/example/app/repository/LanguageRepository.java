package com.example.app.repository;

import com.example.app.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LanguageRepository extends JpaRepository<Language, Integer> {

    List<Language> findByIsActiveTrueOrderByNameAsc();
}
